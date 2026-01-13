const express = require('express');
const { getVedioDataExceptCommentsDocs, getVedioComments, getVedioDocs } = require('./videodata.controller');

const router = express.Router()

router.get('/getVedioDataExceptCommentsDocs',getVedioDataExceptCommentsDocs)

router.get('/getVedioComments',getVedioComments)

router.get('/getVedioDocs',getVedioDocs)

module.exports = router;