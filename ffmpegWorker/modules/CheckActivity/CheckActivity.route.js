const express = require('express');
const { UserActivityController } = require('./CheckActivity.controller');

const router = express.Router()

router.post('/useractivity',UserActivityController)

module.exports = router;