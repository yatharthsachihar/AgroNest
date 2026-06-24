const mongoose = require('mongoose');

// Each row in a bulk order: product name + quantity + unit
const itemSchema = new mongoose.Schema({
  productName: { type: String, default: '' },
  quantity:    { type: String, default: '' },
  unit:        { type: String, default: 'kg' },
}, { _id: false });

const enquirySchema = new mongoose.Schema({
  // What kind of enquiry this is
  type: {
    type: String,
    enum: ['product', 'bulk', 'general', 'faq'],
    default: 'general',
  },

  // For single-product enquiries
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, default: '' },
  quantity:    { type: String, default: '' },

  // For bulk orders — array of product rows
  items: { type: [itemSchema], default: [] },

  // Contact details
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String, required: true },
  companyName: { type: String, default: '' },
  gstNumber:   { type: String, default: '' },
  city:        { type: String, default: '' },
  state:       { type: String, default: '' },

  // Business context
  businessType:   { type: String, default: '' }, // e.g. Retailer, Wholesaler, Farm
  orderFrequency: { type: String, default: '' }, // Monthly, Seasonal, One-time
  preferredDelivery: { type: String, default: '' },

  // Free-text message / extra notes
  message: { type: String, default: '' },

  // Subject / topic (used by FAQ and general enquiries)
  subject: { type: String, default: '' },

  // Admin workflow
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved'],
    default: 'new',
  },
  adminNotes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
