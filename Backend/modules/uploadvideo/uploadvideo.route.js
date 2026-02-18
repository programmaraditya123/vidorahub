const express = require('express')
const { UploadVideoController, getAllVideosController,
    getUploadUrlController,getVibesController } = require('./uploadvideo.contoller')
const { requireSignIn } = require('../auth/auth.middleware')
const { upload } = require('./uploadvideo.service')

const router = express.Router()

router.post("/get-upload-url",requireSignIn,getUploadUrlController);

router.post("/uploadvideo",requireSignIn,UploadVideoController);

router.get('/allvideos',getAllVideosController)

router.get('/allvibes',getVibesController)

module.exports=router