const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  images: [{ type: String }],
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  specifications: [{ key: String, value: String }],
  // Variation Fields
  weight: { type: String, default: '' },
  hasVariations: { type: Boolean, default: false },
  variations: [{
    weight: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: '' },
  }],

  // Visibility flags — admin controls these
  visibleInB2B: { type: Boolean, default: true },
  visibleInB2C: { type: Boolean, default: true },
  // Homepage feature flags — admin toggles these
  isFeatured: { type: Boolean, default: false },
  isTopProduct: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isSeasonal: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  badge: { type: String, default: '' },
  brand: { type: String, default: '' },
  // Inventory fields
  sku:               { type: String, default: '' },
  lowStockThreshold: { type: Number, default: 10 },
  warehouseLocation: { type: String, default: '' },
  trackInventory:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
