const express = require('express')
const { UploadVideoController, getAllVideosController,getUploadUrlController } = require('./uploadvideo.contoller')
const { requireSignIn } = require('../auth/auth.middleware')
const { upload } = require('./uploadvideo.service')

const router = express.Router()

router.post("/get-upload-url",requireSignIn,getUploadUrlController);

router.post("/uploadvideo",requireSignIn,UploadVideoController);

router.get('/allvideos',getAllVideosController)

module.exports=router