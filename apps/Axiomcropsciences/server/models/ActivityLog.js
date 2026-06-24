const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Who did it
  adminId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  adminName: { type: String, default: 'System' },
  adminRole: { type: String, default: 'admin' },

  // What they did
  method:   { type: String, enum: ['GET','POST','PUT','PATCH','DELETE'], required: true },
  url:      { type: String, required: true },
  resource: { type: String, default: 'system' }, // product, order, enquiry, user, etc.
  action:   { type: String, default: '' },         // e.g. "Created product"
  summary:  { type: String, default: '' },         // human-readable one-liner
  targetId: { type: String, default: '' },         // the _id of the affected document

  // Request snapshot (for auditing)
  statusCode: { type: Number, default: 200 },
  ip:         { type: String, default: '' },

}, { timestamps: true });

// Auto-expire logs after 90 days to keep collection lean
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
