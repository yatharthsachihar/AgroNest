const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    // Variation tracking — when a product is bought as a specific variation
    // (e.g. 500g), we record which embedded variation it was so stock can be
    // deducted from / restored to the right place. Null for base purchases.
    variationId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variationWeight: { type: String, default: '' },
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId: { type: String, default: '' },
  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
