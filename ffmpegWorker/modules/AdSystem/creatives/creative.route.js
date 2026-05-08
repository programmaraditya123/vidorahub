// creatives/creative.route.js
const express = require('express');
const router = express.Router();
const { requireSignIn, requireBrand } = require('../shared/middleware/auth.middleware');
const c = require('./creative.controller');

router.use(requireSignIn, requireBrand);
router.post('/creatives', c.addCreative);
router.get('/creatives', c.listCreatives);

module.exports = router;
