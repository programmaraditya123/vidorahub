const express = require('express');
const { getVedioDataExceptCommentsDocs, getVedioComments, getVedioDocs, 
    getNextVideos, postVedioComments } = require('./videodata.controller');
const { requireSignIn } = require('../auth/auth.middleware');
    

const router = express.Router()

router.get('/getVedioDataExceptCommentsDocs/:id',getVedioDataExceptCommentsDocs)

router.post('/postVedioComments/:videoId',requireSignIn,postVedioComments)
router.get('/getVedioComments/:videoId',getVedioComments)

router.get('/getVedioDocs',getVedioDocs)

router.get('/getnextvideos',getNextVideos)

module.exports = router;