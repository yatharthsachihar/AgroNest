const express    = require('express');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/logs — admin only, paginated, filterable
router.get('/', protect, async (req, res) => {
  try {
    const { resource, method, limit = 100, skip = 0 } = req.query;
    const filter = {};
    if (resource) filter.resource = resource;
    if (method)   filter.method   = method;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 500))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/logs — clear all logs (admin only)
router.delete('/', protect, async (req, res) => {
  try {
    await ActivityLog.deleteMany({});
    res.json({ message: 'All logs cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
