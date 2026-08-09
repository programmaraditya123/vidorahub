const express = require('express');
const { createProfile, getProfiles, switchProfile } = require('./accountprofiles.controller');
const { requireSignIn } = require('../auth/auth.middleware');

const router  = express.Router()

router.post("/accountprofile",requireSignIn,createProfile)

router.get("/getprofiles",requireSignIn,getProfiles)

router.patch("/switchProfile",requireSignIn,switchProfile)

module.exports = router;