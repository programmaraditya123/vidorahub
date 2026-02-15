const express = require('express');
const { getReaction, addFollow, addUnFollow } = require('./FollowUnFollow.controller');
const { requireSignIn } = require('../../moddlewares/auth.moddleware');

const router = express.Router();

router.get("/followReaction/:creatorid",requireSignIn,getReaction)

router.post("/follow/:creatorid",requireSignIn,addFollow)

router.post("/unfollow/:creatorid",requireSignIn,addUnFollow)


module.exports = router

