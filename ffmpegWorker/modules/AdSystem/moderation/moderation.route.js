// moderation/moderation.route.js
const express = require('express');
const router = express.Router();
const { requireSignIn, requireAdmin } = require('../shared/middleware/auth.middleware');
const controller = require('./moderation.controller');

router.use(requireSignIn, requireAdmin);
router.get('/pending', controller.listPending);
router.post('/:id/approve', controller.approveCampaign);
router.post('/:id/reject', controller.rejectCampaign);

module.exports = router;
