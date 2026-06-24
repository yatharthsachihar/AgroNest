const express = require('express');
const fs      = require('fs');
const path    = require('path');
const Media   = require('../models/Media');
const { upload, UPLOAD_DIR } = require('../middleware/uploadMiddleware');

const router = express.Router();

// GET /api/media — list all media, optional ?folder= filter
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.folder) filter.folder = req.query.folder;
    const items = await Media.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/media/upload — multipart, field name "file"
// Multer 2 + Express 5: use next(err) pattern, not try/catch around upload()
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // MulterError or our custom fileFilter error
      return res.status(err.status || 400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file received' });

    const media = await Media.create({
      filename:     req.file.filename,
      originalName: req.file.originalname,
      url:          `/uploads/media/${req.file.filename}`,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      folder:       req.body.folder || 'general',
    });

    res.status(201).json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/media/:id
router.delete('/:id', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Not found' });

    const filePath = path.join(UPLOAD_DIR, media.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await media.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
