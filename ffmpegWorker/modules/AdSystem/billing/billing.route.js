// billing/billing.route.js
const express = require('express');
const router = express.Router();
const controller = require('./billing.controller');
const { requireSignIn, requireBrand, requireAdmin } = require('../shared/middleware/auth.middleware');

router.get('/balance', requireSignIn, requireBrand, controller.getMyBalance);
router.get('/transactions', requireSignIn, requireBrand, controller.listMyTransactions);
router.post('/admin/topup', requireSignIn, requireAdmin, controller.adminTopup);

module.exports = router;
