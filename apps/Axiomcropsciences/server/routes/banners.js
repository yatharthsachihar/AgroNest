const express = require('express');
const Banner = require('../models/Banner');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Admin can pass ?all=true to get all banners including inactive
    // Frontend (public) gets only active banners
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const banners = await Banner.find(filter).sort({ displayOrder: 1 });
    res.json(banners);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(banner);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
