const express = require('express');
const { addTags, getTagVideos } = require('./videos.controller');

const router = express.Router()

router.get("/getTagVideos/:tag/:sort",getTagVideos)

router.post("/addtags/:id",addTags);

module.exports = router;