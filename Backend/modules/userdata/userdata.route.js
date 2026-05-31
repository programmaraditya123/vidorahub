const express = require('express');
const router = express.Router();
const {getUserProfileData} = require('./userdata.contoller');
const {requireSignIn} = require('../auth/auth.middleware');

router.get('/getUserProfileData',requireSignIn,getUserProfileData)

module.exports = router;