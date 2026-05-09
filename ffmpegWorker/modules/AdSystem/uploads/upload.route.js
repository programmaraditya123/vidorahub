// uploads/upload.route.js
const express = require('express');
const router = express.Router();
const { requireSignIn, requireBrand } = require('../shared/middleware/auth.middleware');
const { upload } = require('./upload.helper');
const { uploadCreativeMedia } = require('./upload.controller');

const handleUpload = (req, res, next) => {
  upload.single('media')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(413).json({ error: 'file too large (max 50MB)' });
      if (err.message === 'UNSUPPORTED_MIMETYPE')
        return res.status(400).json({ error: 'unsupported mimetype (image/video only)' });
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.post('/upload', requireSignIn, requireBrand, handleUpload, uploadCreativeMedia);

module.exports = router;
