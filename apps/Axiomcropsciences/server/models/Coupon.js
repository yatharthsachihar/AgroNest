const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:            { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value:           { type: Number, required: true },
  minOrderAmount:  { type: Number, default: 0 },
  maxDiscount:     { type: Number, default: null },
  usageLimit:      { type: Number, default: null },
  usedCount:       { type: Number, default: 0 },
  startDate:       { type: Date, default: null },
  expiresAt:       { type: Date, default: null },
  isActive:        { type: Boolean, default: true },
  applicableProducts:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  description:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
