const mongoose = require('mongoose');

// A "section" is one editable block on a page.
// Type tells the frontend what design component to render.
const sectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['hero', 'stats', 'team', 'values', 'faq', 'contact_info', 'map', 'rich_text', 'cta'],
    required: true,
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
}, { _id: true });

const pageSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  slug:     { type: String, required: true, unique: true },
  sections: { type: [sectionSchema], default: [] },
  status:   { type: String, enum: ['draft', 'published'], default: 'published' },
  seoTitle:       { type: String, default: '' },
  seoDescription: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);
