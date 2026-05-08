// delivery/delivery.route.js
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../shared/middleware/optionalAuth.middleware');
const { getAds } = require('./delivery.controller');

router.get('/serve', optionalAuth, getAds);

module.exports = router;
