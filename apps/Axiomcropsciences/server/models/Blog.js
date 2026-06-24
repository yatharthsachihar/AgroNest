const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  slug:          { type: String, required: true, unique: true },
  content:       { type: String, default: '' },
  excerpt:       { type: String, default: '' },
  featuredImage: { type: String, default: '' },
  category:      { type: String, default: 'General' },
  tags:          [{ type: String }],
  status:        { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
  publishedAt:   { type: Date, default: null },
  author:        { type: String, default: 'Admin' },
  seoTitle:        { type: String, default: '' },
  seoDescription:  { type: String, default: '' },
  seoKeywords:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
