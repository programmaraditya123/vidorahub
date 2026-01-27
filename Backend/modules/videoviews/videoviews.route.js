const express = require('express');
const { postView } = require('./videoView.controller');
const { requireSignIn } = require('../auth/auth.middleware');

const router = express.Router()

router.post('/views',requireSignIn,postView)

module.exports = router;