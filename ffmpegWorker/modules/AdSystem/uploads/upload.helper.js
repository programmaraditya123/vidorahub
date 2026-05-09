// uploads/upload.helper.js
// Multer disk storage for ad creative media. Uploads go to /uploads/ads
// (served statically by server.js at /static/ads/*).
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// modules/AdSystem/uploads -> ../../../uploads/ads (3 levels up to ffmpegWorker root)
const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'ads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'))
    return cb(null, true);
  return cb(new Error('UNSUPPORTED_MIMETYPE'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

module.exports = { upload, UPLOAD_DIR };
