const express = require("express");
const { getSearchKeywords, getSearchResults } = require("./search.controller");

const router = express.Router();

router.get("/keywords", getSearchKeywords);

router.get("/results", getSearchResults);

module.exports = router;