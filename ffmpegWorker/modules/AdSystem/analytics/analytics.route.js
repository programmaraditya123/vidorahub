// analytics/analytics.route.js
const express = require('express');
const router = express.Router();
const adAnalyticsController = require('./analytics.controller');

router.post('/event/impression', adAnalyticsController.recordImpression);
router.post('/event/click', adAnalyticsController.recordClick);

module.exports = router;
