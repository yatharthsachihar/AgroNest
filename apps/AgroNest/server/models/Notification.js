const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['order', 'customer', 'product', 'inventory', 'payment', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  referenceId: {
    type: String,
  },
  referenceType: {
    type: String,
  }
}, { timestamps: true });

// Optional: Keep only notifications from the last 30 days automatically (TTL index)
// notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
