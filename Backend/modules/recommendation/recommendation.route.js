const express = require("express");
const { getHomeVideoFeed, getHomeVibesFeed } = require("./recommendation.controller");
const {requireSignIn} = require('../auth/auth.middleware')

const router = express.Router()

router.get('/getHomeVideoFeed',getHomeVideoFeed)
router.post('/getHomeVideoFeed',getHomeVideoFeed)

router.post('/getHomeVibesFeed',getHomeVibesFeed)

module.exports = router;
