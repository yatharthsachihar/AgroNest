const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: { type: String, default: '' },
  link: { type: String, default: '' },
  badge: { type: String, default: '' },
  ctaText: { type: String, default: 'Shop Now' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
