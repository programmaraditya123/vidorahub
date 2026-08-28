const express = require('express');
const { sendVideoProgress, getVideoProgress } = require('./videoprogress.controller');
const {requireSignIn} = require('../auth/auth.middleware')

const router = express.Router();

router.post('/sendVideoProgress',requireSignIn,sendVideoProgress)

router.get('/getVideoProgress',requireSignIn,getVideoProgress)

module.exports = router;