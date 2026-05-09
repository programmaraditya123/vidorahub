// campaigns/campaign.route.js
const express = require('express');
const router = express.Router();
const { requireSignIn, requireBrand } = require('../shared/middleware/auth.middleware');
const c = require('./campaign.controller');

router.use(requireSignIn, requireBrand);
router.post('/campaigns', c.createCampaign);
router.get('/campaigns', c.listMyCampaigns);
router.get('/campaigns/:id', c.getCampaign);
router.patch('/campaigns/:id', c.updateCampaign);
router.post('/campaigns/:id/pause', c.pauseCampaign);
router.post('/campaigns/:id/resume', c.resumeCampaign);

module.exports = router;
