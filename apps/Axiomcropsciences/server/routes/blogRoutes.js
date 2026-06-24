const express = require('express');
const Blog    = require('../models/Blog');
const { protect } = require('../middleware/authMiddleware');
const router  = express.Router();

// GET /api/blogs  — public, supports ?status= and ?search=
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title:   { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { tags:    { $in: [new RegExp(search, 'i')] } },
    ];
    const blogs = await Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 });
    res.json(blogs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/blogs/slug/:slug  — public, fetch one post by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' });
    if (!blog) return res.status(404).json({ message: 'Not found' });
    res.json(blog);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/blogs/:id  — public or admin, fetch one post by mongo id
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Not found' });
    res.json(blog);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/blogs  — admin only
router.post('/', protect, async (req, res) => {
  try {
    // Auto-set publishedAt when publishing
    const data = { ...req.body };
    if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();
    const blog = await Blog.create(data);
    res.status(201).json(blog);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/blogs/:id  — admin only
router.put('/:id', protect, async (req, res) => {
  try {
    const data = { ...req.body };
    // Set publishedAt when status changes to published
    const existing = await Blog.findById(req.params.id);
    if (existing && data.status === 'published' && existing.status !== 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const blog = await Blog.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(blog);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/blogs/:id  — admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
