const mongoose = require('mongoose');

// Each module entry in the matrix
const moduleSchema = new mongoose.Schema({
  label: { type: String, required: true },
  key:   { type: String, required: true },
  permissions: {
    super_admin: { type: String, enum: ['full','view','none'], default: 'full' },
    admin:       { type: String, enum: ['full','view','none'], default: 'full' },
    editor:      { type: String, enum: ['full','view','none'], default: 'view' },
    support:     { type: String, enum: ['full','view','none'], default: 'view' },
    viewer:      { type: String, enum: ['full','view','none'], default: 'view' },
  },
}, { _id: false });

const rolePermissionSchema = new mongoose.Schema({
  matrix: { type: [moduleSchema], required: true, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
