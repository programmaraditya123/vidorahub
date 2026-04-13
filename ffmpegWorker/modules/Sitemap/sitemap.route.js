const express = require('express');
const { getAllVideosSitemap } = require('./sitemap.controller');

const router = express.Router()

router.get('/getsitemap',getAllVideosSitemap)

module.exports = router;