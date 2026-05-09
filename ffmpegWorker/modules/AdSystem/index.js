// modules/AdSystem/index.js
// Barrel: mounts every AdSystem sub-feature on a single Express router.
// Server.js mounts this once at /api/v1 (feed) and /api/v1/ads (everything else).
//
// Sub-routes registered here use paths RELATIVE to the prefix the parent assigns,
// so we expose two routers: one for /api/v1/ads and one for /api/v1 (feed).

const express = require('express');

const campaignRoutes = require('./campaigns/campaign.route');
const creativeRoutes = require('./creatives/creative.route');
const uploadRoutes = require('./uploads/upload.route');
const moderationRoutes = require('./moderation/moderation.route');
const billingRoutes = require('./billing/billing.route');
const deliveryRoutes = require('./delivery/delivery.route');
const analyticsRoutes = require('./analytics/analytics.route');
const feedRoutes = require('./feed/feed.route');

const adCron = require('./analytics/analytics.cron');

// Router for /api/v1/ads/*
const adsRouter = express.Router();
adsRouter.use(campaignRoutes);
adsRouter.use(creativeRoutes);
adsRouter.use(uploadRoutes);
// Note: original API exposed moderation at /api/v1/ads/{pending,:id/approve,:id/reject}
// (no /moderation prefix). Preserved for backward compatibility.
adsRouter.use(moderationRoutes);
adsRouter.use(billingRoutes);
adsRouter.use(deliveryRoutes);
adsRouter.use(analyticsRoutes);

// Router for /api/v1/* (public feed)
const publicRouter = express.Router();
publicRouter.use(feedRoutes);

module.exports = {
  adsRouter,
  publicRouter,
  adCron,
};
