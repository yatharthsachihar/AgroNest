const express  = require('express');
const Category = require('../models/Category');
const Product  = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Public — all active categories with product count
router.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const filter = all ? {} : { status: 'active' };
    const categories = await Category.find(filter).sort({ displayOrder: 1 });

    // Attach product count to each category
    const withCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, status: 'active' });
        return { ...cat.toObject(), productCount: count };
      })
    );
    res.json(withCount);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — GET one category
router.get('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — CREATE
router.post('/', protect, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — UPDATE
router.put('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
