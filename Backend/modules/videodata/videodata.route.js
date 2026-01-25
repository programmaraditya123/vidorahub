const express = require('express');
const { getVedioDataExceptCommentsDocs, getVedioComments, getVedioDocs, 
    getNextVideos, postVedioComments, 
    getCreatorProfileData} = require('./videodata.controller');
const { requireSignIn } = require('../auth/auth.middleware');
    

const router = express.Router()

router.get('/getVedioDataExceptCommentsDocs/:id',getVedioDataExceptCommentsDocs)

router.post('/postVedioComments/:videoId',requireSignIn,postVedioComments)

router.get('/getVedioComments/:videoId',getVedioComments)

//only this route is not used yet
router.get('/getVedioDocs',getVedioDocs)

router.get('/getnextvideos',getNextVideos)


//the below is the creator profile data

router.get('/creatorProfile',requireSignIn,getCreatorProfileData)

module.exports = router;