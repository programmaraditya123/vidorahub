const express = require('express');
const { addBrand, addProfilePicture } = require('./studio.controller');

const router = express.Router();

router.post('/addBrand',addBrand)

router.post('addProfilePicture',addProfilePicture)


module.exports = router;