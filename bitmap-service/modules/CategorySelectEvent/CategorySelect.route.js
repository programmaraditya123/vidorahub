const express = require('express');
const { SelectedCategory } = require('./CategorySelect.controller');

const router = express.Router()

router.post('/selectedcategory',SelectedCategory)


module.exports = router;