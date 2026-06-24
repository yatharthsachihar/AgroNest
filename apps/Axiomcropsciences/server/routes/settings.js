const express = require('express');
const StoreSettings = require('../models/StoreSettings');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Public — frontend fetches this to know current mode
router.get('/', async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = await StoreSettings.create({});
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin — update any settings including storeMode
router.put('/', protect, async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = new StoreSettings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
