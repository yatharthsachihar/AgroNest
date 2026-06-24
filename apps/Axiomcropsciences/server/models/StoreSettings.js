const mongoose = require('mongoose');

// StoreSettings is THE core model — controls B2B/B2C/Hybrid mode globally
const storeSettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Axiom Seeds' },
  tagline: { type: String, default: 'Grow Better. Harvest More.' },
  logo: { type: String, default: '' },
  storeMode: { type: String, enum: ['b2b', 'b2c', 'hybrid'], default: 'b2b' },
  contactEmail: { type: String, default: 'axiomcropsciences@gmail.com' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  address: { type: String, default: '' },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    linkedin: { type: String, default: '' },
  },
  heroTitle: { type: String, default: 'Better Seeds. Stronger Crops. Bigger Harvests.' },
  heroSubtitle: { type: String, default: 'Premium quality seeds and pesticides for a healthier tomorrow.' },
  heroBannerImage: { type: String, default: '' },
  showPricesInB2B: { type: Boolean, default: false },
  freeShippingAbove: { type: Number, default: 999 },
  metaTitle: { type: String, default: 'Axiom Seeds - Agricultural Products' },
  metaDescription: { type: String, default: 'Premium seeds, pesticides, and crop protection solutions.' },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
