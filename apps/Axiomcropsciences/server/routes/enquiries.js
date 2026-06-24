const express = require('express');
const Enquiry = require('../models/Enquiry');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Public — submit enquiry
router.post('/', async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);
    res.status(201).json(enquiry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Admin — get all enquiries
router.get('/', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find().populate('product', 'name').sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — update enquiry status
router.put('/:id', protect, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(enquiry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Enquiry deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
