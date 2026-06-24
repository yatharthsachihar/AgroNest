const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const Product  = require('../models/Product');
const Category = require('../models/Category');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const sseManager = require('../utils/sse');
const { UPLOAD_DIR } = require('../middleware/uploadMiddleware');

// ── Soft auth: attach admin info if token present, don't block if missing ──
const softAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.admin = jwt.verify(token, process.env.JWT_SECRET);
    } catch { /* invalid token — treat as public */ }
  }
  next();
};

const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────
// CSV bulk import (with optional product images)
// ─────────────────────────────────────────────────

// Dedicated multer that accepts the CSV file plus image files. The shared
// media upload middleware rejects CSVs, so we configure our own here.
const importStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const importUpload = multer({
  storage: importStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 250 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok = file.fieldname === 'csv'
      ? /\.csv$/i.test(file.originalname) || /csv|excel|text\/plain/.test(file.mimetype)
      : /\.(jpe?g|png|gif|webp|svg)$/i.test(ext);
    if (ok) return cb(null, true);
    const err = new Error(`Unsupported file for "${file.fieldname}": ${file.originalname}`);
    err.status = 400;
    cb(err, false);
  },
});

// Minimal but correct CSV parser — handles quoted fields, embedded commas,
// escaped double-quotes ("") and CRLF/LF line endings. Returns row objects
// keyed by the (lowercased, trimmed) header names.
function parseCSV(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  text = text.replace(/^﻿/, ''); // strip BOM
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v.trim() !== '')) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
}

const slugify = (s) => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// POST /api/products/import — multipart: csv (1) + images (many)
router.post('/import', protect, (req, res, next) => {
  importUpload.fields([{ name: 'csv', maxCount: 1 }, { name: 'images', maxCount: 250 }])(req, res, (err) => {
    if (err) return res.status(err.status || 400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  const csvFile = req.files?.csv?.[0];
  const imageFiles = req.files?.images || [];
  try {
    if (!csvFile) return res.status(400).json({ message: 'No CSV file received (field name must be "csv")' });

    const text = fs.readFileSync(csvFile.path, 'utf8');
    const records = parseCSV(text);
    if (!records.length) return res.status(400).json({ message: 'CSV has no data rows' });

    // Index uploaded images by their original base filename (lowercased) so a
    // row can reference "kedarnath.png" OR just match on the product name.
    const imageByName = {};
    for (const f of imageFiles) {
      const base = path.basename(f.originalname, path.extname(f.originalname)).toLowerCase();
      imageByName[f.originalname.toLowerCase()] = `/uploads/media/${f.filename}`;
      imageByName[base] = `/uploads/media/${f.filename}`;
    }

    // Cache categories by lowercased name; create missing ones on the fly.
    const catCache = {};
    const ensureCategory = async (name) => {
      const key = name.toLowerCase();
      if (catCache[key]) return catCache[key];
      let cat = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (!cat) {
        cat = await Category.create({ name, slug: slugify(name) || key });
      }
      catCache[key] = cat;
      return cat;
    };

    const result = { created: 0, skipped: 0, categoriesCreated: 0, errors: [] };
    const existingCatCount = await Category.countDocuments();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const line = i + 2; // human-friendly (header = line 1)
      try {
        const name = row.name || row['product name'] || row.title;
        if (!name) { result.errors.push(`Line ${line}: missing product name`); continue; }

        const slug = slugify(name);
        if (await Product.findOne({ slug })) { result.skipped++; continue; }

        const catName = row.category || row.crop || row.croptype || 'Uncategorized';
        const category = await ensureCategory(catName);

        // Resolve images: explicit URLs/filenames in the row, else auto-match
        // an uploaded file by the product name.
        const images = [];
        const imgRef = row.images || row.image || row.imagefile || '';
        for (const part of imgRef.split(/[|;]/).map(s => s.trim()).filter(Boolean)) {
          if (/^https?:\/\//i.test(part) || part.startsWith('/uploads/')) images.push(part);
          else if (imageByName[part.toLowerCase()]) images.push(imageByName[part.toLowerCase()]);
        }
        if (!images.length && imageByName[name.toLowerCase()]) images.push(imageByName[name.toLowerCase()]);
        if (!images.length && imageByName[slug]) images.push(imageByName[slug]);

        const specs = [];
        if (row.seedtype || row.type) specs.push({ key: 'Seed Type', value: row.seedtype || row.type });
        if (row.croptype || row.crop) specs.push({ key: 'Crop', value: row.croptype || row.crop });

        await Product.create({
          name,
          slug,
          category: category._id,
          description: row.description || '',
          shortDescription: row.shortdescription || row.description || '',
          price: Number(row.price) || 0,
          stock: Number(row.stock) || 0,
          unit: row.unit || 'packet',
          brand: row.brand || '',
          sku: row.sku || '',
          images,
          specifications: specs,
          status: 'active',
        });
        result.created++;
      } catch (rowErr) {
        result.errors.push(`Line ${line}: ${rowErr.message}`);
      }
    }

    result.categoriesCreated = (await Category.countDocuments()) - existingCatCount;

    if (result.created > 0) {
      sseManager.dispatch({
        type: 'product', title: 'Products Imported',
        message: `${result.created} product(s) imported via CSV.`,
        referenceType: 'Product',
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Product import error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    // Always remove the temp CSV; images are kept (they're referenced by products).
    if (csvFile) fs.unlink(csvFile.path, () => {});
  }
});

// ─────────────────────────────────────────────────
// GET /api/products  — public browse + admin list
// ─────────────────────────────────────────────────
router.get('/', softAuth, async (req, res) => {
  try {
    const {
      mode, category, featured, bestseller, newarrival,
      trending, topselling, seasonal, search,
      status, lowStock, page, limit = 20,
    } = req.query;

    let filter = {};
    const isAdmin = !!req.admin;

    // Status filter
    if (status) {
      filter.status = status;             // explicit status (admin passing "inactive")
    } else if (!isAdmin) {
      filter.status = 'active';           // public: only active
      // if admin but no status param → show all statuses
    }

    // Mode visibility (public browsing)
    if (mode === 'b2b') filter.visibleInB2B = true;
    if (mode === 'b2c') filter.visibleInB2C = true;

    // Category
    if (category) filter.category = category;

    // Feature flags
    if (featured   === 'true') filter.isFeatured   = true;
    if (bestseller === 'true') filter.isBestSeller  = true;
    if (newarrival === 'true') filter.isNewArrival   = true;
    if (trending   === 'true') filter.isTrending    = true;
    if (topselling === 'true') filter.isTopProduct  = true;
    if (seasonal   === 'true') filter.isSeasonal    = true;

    // Search
    if (search) filter.name = { $regex: search, $options: 'i' };

    // Low stock filter (admin only — "stock at/below lowStockThreshold")
    if (isAdmin && lowStock === 'true') {
      filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    const pageNum   = Math.max(1, Number(page) || 1);
    const limitNum  = Math.min(100, Number(limit));
    const skip      = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    // Always return paginated object (admin needs meta; public pages use .products)
    if (page || isAdmin) {
      return res.json({ products, total, page: pageNum, limit: limitNum });
    }

    // Legacy public array format (HomeSections uses this)
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ─────────────────────────────────────────────────
// POST /api/products — create (admin only)
// ─────────────────────────────────────────────────
router.post('/bulk-delete', protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid product IDs provided' });
    }

    const result = await Product.deleteMany({ _id: { $in: validIds } });

    sseManager.dispatch({
      type: 'product',
      title: 'Products Deleted',
      message: `${result.deletedCount} product${result.deletedCount === 1 ? '' : 's'} removed from the catalog.`,
    });

    res.json({ message: 'Products deleted', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────
// POST /api/products/bulk-status — activate/deactivate many (admin only)
// ─────────────────────────────────────────────────
router.post('/bulk-status', protect, async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid product IDs provided' });
    }

    const result = await Product.updateMany(
      { _id: { $in: validIds } },
      { $set: { status } }
    );

    res.json({ message: 'Products updated', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { variations, ...productData } = req.body;
    
    if (variations && variations.length > 0) {
      productData.hasVariations = true;
      productData.variations = variations;
    }

    const product = await Product.create(productData);
    
    sseManager.dispatch({
      type: 'product',
      title: 'New Product Added',
      message: `${product.name} has been added to the catalog.`,
      referenceId: product._id,
      referenceType: 'Product'
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────
// PATCH /api/products/:id/flags — toggle collection flags only
// (Featured / Top / New Arrival / Best Seller / Trending / Seasonal).
// Separate from the full PUT so it never touches variations or other fields.
// ─────────────────────────────────────────────────
const FLAG_KEYS = ['isFeatured', 'isTopProduct', 'isNewArrival', 'isBestSeller', 'isTrending', 'isSeasonal'];
router.patch('/:id/flags', protect, async (req, res) => {
  try {
    const update = {};
    for (const key of FLAG_KEYS) {
      if (req.body[key] !== undefined) update[key] = !!req.body[key];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No collection flags provided' });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────
// PATCH /api/products/:id/stock — quick stock update
// ─────────────────────────────────────────────────
router.patch('/:id/stock', protect, async (req, res) => {
  try {
    const { stock, lowStockThreshold, warehouseLocation, sku, trackInventory } = req.body;
    const update = {};
    if (stock              !== undefined) update.stock              = Number(stock);
    if (lowStockThreshold  !== undefined) update.lowStockThreshold  = Number(lowStockThreshold);
    if (warehouseLocation  !== undefined) update.warehouseLocation  = warehouseLocation;
    if (sku                !== undefined) update.sku                = sku;
    if (trackInventory     !== undefined) update.trackInventory     = trackInventory;

    const product = await Product.findByIdAndUpdate(
      req.params.id, update, { new: true }
    ).populate('category', 'name slug');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Stock alert logic
    if (stock !== undefined) {
      if (product.stock === 0) {
        sseManager.dispatch({
          type: 'inventory',
          title: 'Out of Stock',
          message: `${product.name} is now out of stock.`,
          referenceId: product._id,
          referenceType: 'Product'
        });
      } else if (product.stock <= product.lowStockThreshold) {
        sseManager.dispatch({
          type: 'inventory',
          title: 'Low Stock Alert',
          message: `${product.name} has dropped to ${product.stock} units.`,
          referenceId: product._id,
          referenceType: 'Product'
        });
      }
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────
// GET /api/products/:slugOrId  — single product
// ─────────────────────────────────────────────────
router.get('/:slugOrId', async (req, res) => {
  try {
    const id = req.params.slugOrId;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };

    const product = await Product.findOne(query).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────
// PUT /api/products/:id — update (admin only)
// ─────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const { variations, ...productData } = req.body;
    
    if (variations && variations.length > 0) {
      productData.hasVariations = true;
      productData.variations = variations;
    } else {
      productData.hasVariations = false;
      productData.variations = [];
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Stock alert logic for full updates
    if (req.body.stock !== undefined && !product.hasVariations) {
      if (product.stock === 0) {
        sseManager.dispatch({
          type: 'inventory',
          title: 'Out of Stock',
          message: `${product.name} is now out of stock.`,
          referenceId: product._id,
          referenceType: 'Product'
        });
      } else if (product.stock <= product.lowStockThreshold) {
        sseManager.dispatch({
          type: 'inventory',
          title: 'Low Stock Alert',
          message: `${product.name} has dropped to ${product.stock} units.`,
          referenceId: product._id,
          referenceType: 'Product'
        });
      }
    }

    return res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/products/:id — delete (admin only)
// ─────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Dispatch Notification
    sseManager.dispatch({
      type: 'product',
      title: 'Product Deleted',
      message: `${product.name} was removed from the catalog.`,
    });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
