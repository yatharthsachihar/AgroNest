const express  = require('express');
const { protect, clearPermissionMatrixCache } = require('../middleware/authMiddleware');
const { MODULES } = require('../utils/permissionDefaults');
const Settings = require('../models/Settings');
const router = express.Router();

// We store the editable permission matrix inside the Settings document
// under settings.permissionMatrix (array of module objects)
// Falls back to hardcoded defaults if not set yet.

const getMatrix = async () => {
  const settings = await Settings.findOne().lean();
  if (settings?.permissionMatrix?.length) return settings.permissionMatrix;
  return MODULES; // return hardcoded defaults
};

// GET /api/roles/matrix
router.get('/matrix', protect, async (req, res) => {
  try {
    res.json(await getMatrix());
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/roles/matrix — super_admin only
router.put('/matrix', protect, async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin')
      return res.status(403).json({ message: 'Only Super Admins can edit the permission matrix.' });

    const matrix = req.body;
    if (!Array.isArray(matrix)) return res.status(400).json({ message: 'Matrix must be an array' });

    await Settings.findOneAndUpdate(
      {}, { permissionMatrix: matrix }, { upsert: true, new: true }
    );
    clearPermissionMatrixCache();
    res.json(matrix);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/roles/reset — super_admin only
router.post('/reset', protect, async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin')
      return res.status(403).json({ message: 'Only Super Admins can reset the matrix.' });

    await Settings.findOneAndUpdate(
      {}, { permissionMatrix: MODULES }, { upsert: true, new: true }
    );
    clearPermissionMatrixCache();
    res.json(MODULES);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
