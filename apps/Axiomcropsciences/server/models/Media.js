const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename:   { type: String, required: true },   // generated unique filename on disk
  originalName: { type: String, default: '' },    // name the file was uploaded with
  url:        { type: String, required: true },   // public path, e.g. /uploads/media/xxx.jpg
  mimeType:   { type: String, default: '' },
  size:       { type: Number, default: 0 },        // bytes
  folder:     { type: String, default: 'general' }, // logical grouping: products, banners, blog, general
  uploadedBy: { type: String, default: 'admin' },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
