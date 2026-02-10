const express = require('express');
const { getVedioDataExceptCommentsDocs, getVedioComments, getVedioDocs, 
    getNextVideos, postVedioComments, 
    getCreatorProfileData,
    deleteVideo,
    getCreatorChannel} = require('./videodata.controller');
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

//the below api are where creator changes its video permision and details

router.put('/deletevideo',requireSignIn,deleteVideo)

router.get('/creatorchannel/:id',getCreatorChannel)

module.exports = router;