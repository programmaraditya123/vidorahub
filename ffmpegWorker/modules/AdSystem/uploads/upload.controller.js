// uploads/upload.controller.js
exports.uploadCreativeMedia = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    return res.status(200).json({
      mediaUrl: `/static/ads/${req.file.filename}`,
      mediaType,
      sizeBytes: req.file.size,
      filename: req.file.filename,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
