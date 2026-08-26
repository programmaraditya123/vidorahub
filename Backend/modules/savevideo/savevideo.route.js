const express = require("express");

const {
    saveVideo,
    unsaveVideo,
    saveVideoStatus,
    allSavedVideo,
} = require("./savevideo.controller");

const {
    requireSignIn,
} = require("../auth/auth.middleware");

const router = express.Router();


router.post(
    "/saveVideo",
    requireSignIn,
    saveVideo
);


router.delete(
    "/saveVideo",
    requireSignIn,
    unsaveVideo
);


router.get(
    "/saveVideoStatus",
    requireSignIn,
    saveVideoStatus
);

router.get(
    "/allSavedVideo",
    requireSignIn,
    allSavedVideo
);


module.exports = router;


// const express = require('express');
// const { saveVideo, saveVideoStatus, allSavedVideo } = require('./savevideo.controller');
// const {requireSignIn} = require('../auth/auth.middleware')

// const router = express.Router();

// router.post('/saveVideo',requireSignIn,saveVideo)

// router.get('/saveVideoStatus',requireSignIn,saveVideoStatus)

// router.get('/allSavedVideo',requireSignIn,allSavedVideo)

// module.exports = router;