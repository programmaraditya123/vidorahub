// feed/feed.route.js
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../shared/middleware/optionalAuth.middleware');
const { getFeed } = require('./feed.controller');

router.get('/feed', optionalAuth, getFeed);

module.exports = router;
