const express = require('express');
const { getVedioDataExceptCommentsDocs, getVedioComments, getVedioDocs, getNextVideos } = require('./videodata.controller');

const router = express.Router()

router.get('/getVedioDataExceptCommentsDocs/:id',getVedioDataExceptCommentsDocs)

router.get('/getVedioComments',getVedioComments)

router.get('/getVedioDocs',getVedioDocs)

router.get('/getnextvideos',getNextVideos)

module.exports = router;