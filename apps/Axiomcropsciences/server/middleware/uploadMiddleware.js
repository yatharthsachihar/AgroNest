const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'media');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const base   = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const ALLOWED_EXT  = /\.(jpe?g|png|gif|webp|svg|pdf)$/i;
const ALLOWED_MIME = /^(image\/(jpeg|png|gif|webp|svg\+xml)|application\/pdf)$/;

const fileFilter = (_req, file, cb) => {
  const extOk  = ALLOWED_EXT.test(path.extname(file.originalname));
  const mimeOk = ALLOWED_MIME.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  // Multer 2: pass an Error with `status` so Express can forward it
  const err = new Error('Only images (jpg, png, gif, webp, svg) and PDFs are allowed');
  err.status = 400;
  cb(err, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — allow full-resolution photos
});

module.exports = { upload, UPLOAD_DIR };
