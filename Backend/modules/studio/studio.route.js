const express = require('express');
const { addBrand, addProfilePicture, getCreator, addBasicInfo, addCreatorPlatform, addShowcaseContent, deleteShowcaseContent, addExperience, deleteExperience } = require('./studio.controller');
const { requireSignIn } = require('../auth/auth.middleware');
const { upload } = require('../uploadvideo/uploadvideo.service');
 

const router = express.Router();

router.post('/addBrand',addBrand)

router.post('/addProfilePicture',requireSignIn,upload.single('image'),addProfilePicture)

router.get('/getcreator',requireSignIn,getCreator)

router.post('/addCreatorBasicInfo',requireSignIn,addBasicInfo)

router.post('/addCreatorPlatform',requireSignIn,addCreatorPlatform)

router.post('/addShowcaseContent',requireSignIn,upload.single('thumbnail'),addShowcaseContent)

router.delete('/deleteShowcaseContent/:contentId',requireSignIn,deleteShowcaseContent)

router.post('/addExperience',requireSignIn,addExperience)

router.delete('/deleteExperience/:experienceId',requireSignIn,deleteExperience)

module.exports = router;