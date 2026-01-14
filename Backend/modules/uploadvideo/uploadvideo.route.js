const express = require('express')
const { UploadVideoController, getAllVideosController } = require('./uploadvideo.contoller')
const { requireSignIn } = require('../auth/auth.middleware')
const { upload } = require('./uploadvideo.service')

const router = express.Router()

// router.post('/uploadvideo',requireSignIn,upload.single('video'),UploadVideoController)
router.post(
  '/uploadvideo',
  requireSignIn,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  UploadVideoController
);


router.get('/allvideos',getAllVideosController)

module.exports=router