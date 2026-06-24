const express  = require('express');
const router   = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/authMiddleware');

// All SEO fields are stored inside the Settings document
// GET  /api/seo  — return SEO-related fields
router.get('/', protect, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return res.status(404).json({ message: 'Settings not found' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT  /api/seo  — update SEO fields only (merge into Settings)
router.put('/', protect, async (req, res) => {
  try {
    const SEO_FIELDS = [
      'seoSiteName', 'seoTitle', 'seoDescription', 'seoCanonical',
      'seoKeywords', 'seoGoogleVerify', 'seoBingVerify',
      'ogTitle', 'ogDescription', 'ogImage',
      'twitterCard', 'twitterHandle', 'twitterTitle', 'twitterDescription',
      'schemaOrgName', 'schemaOrgUrl', 'schemaOrgLogo', 'schemaOrgFounded',
      'schemaOrgPhone', 'schemaOrgEmail',
      'schemaAddress', 'schemaCity', 'schemaState', 'schemaPostal',
      'robotsTxt', 'gaId', 'gtmId', 'fbPixelId', 'hotjarId',
    ];

    const updates = {};
    SEO_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
