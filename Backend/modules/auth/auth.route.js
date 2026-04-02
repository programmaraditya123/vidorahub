const express = require('express')
const {userRegister,userLoginController, googleAuthController} = require('./auth.controller')
const {requireSignIn} = require('./auth.middleware')


const Router = express.Router();

//register route 
Router.post('/register',userRegister)

Router.post('/userlogin',userLoginController)

Router.get('/check-session',requireSignIn,(req,res) => {
    res.status(200).json({ok:true,user:req.user})
})

Router.post("/google-login", googleAuthController);


module.exports = Router;