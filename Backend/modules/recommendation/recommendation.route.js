const express = require("express");
const { getHomeFeed } = require("./recommendation.controller");

const router = express.Router()

router.get('/getHomeFeed',getHomeFeed)

module.exports = router;