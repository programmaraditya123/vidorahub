const express = require('express');
const { addBrand, addProfilePicture, getCreator, addBasicInfo, 
    addCreatorPlatform, addShowcaseContent, deleteShowcaseContent, 
    addExperience, deleteExperience, getAllCreators, getAllBrands, 
    getBrand,
    getOneCreator} = require('./studio.controller');
const { requireSignIn } = require('../auth/auth.middleware');
const { upload } = require('../uploadvideo/uploadvideo.service');
const { get } = require('mongoose');
 

const router = express.Router();

router.post('/addBrand',requireSignIn,addBrand)

router.get('/allBrands',getAllBrands)

router.get('/getBrand/:brandId',getBrand)






router.get('/getOneCreator/:creatorId',getOneCreator)

router.post('/addProfilePicture',requireSignIn,upload.single('image'),addProfilePicture)

router.get('/getcreator',requireSignIn,getCreator)

router.post('/addCreatorBasicInfo',requireSignIn,addBasicInfo)

router.post('/addCreatorPlatform',requireSignIn,addCreatorPlatform)

router.post('/addShowcaseContent',requireSignIn,upload.single('thumbnail'),addShowcaseContent)

router.delete('/deleteShowcaseContent/:contentId',requireSignIn,deleteShowcaseContent)

router.post('/addExperience',requireSignIn,addExperience)

router.delete('/deleteExperience/:experienceId',requireSignIn,deleteExperience)

router.get('/getAllCreators',getAllCreators)


 

module.exports = router;