const express = require('express');
const { addLike, removeLike, addDislike, removeDislike, 
    validateeLikeDislike, getVideoReactions, 
    getLikedVideos,
    getDislikedVideos} = require('../controllers/like.controller');
const { requireSignIn } = require('../moddlewares/auth.moddleware');

const router = express.Router()

router.post('/addLike',requireSignIn,addLike)


router.post('/removeLike',requireSignIn,removeLike)

router.post('/addDislike',requireSignIn,addDislike)

router.post('/removeDislike',requireSignIn,removeDislike)

router.get('/validateLikeDislike',requireSignIn,validateeLikeDislike)

router.get("/reactions",getVideoReactions);

router.get('/getLikedVideos',getLikedVideos)

router.get('/getDislikedVideos',getDislikedVideos)





module.exports = router;