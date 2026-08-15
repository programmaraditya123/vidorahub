const express = require("express");
const { getHomeFeed } = require("./recommendation.controller");
const {requireSignIn} = require('../auth/auth.middleware')

const router = express.Router()

router.get('/getHomeFeed',getHomeFeed)

module.exports = router;