const express = require('express')
const {userRegister,userLoginController} = require('./auth.controller')
const {requireSignIn} = require('./auth.middleware')


const Router = express.Router();

//register route 
Router.post('/register',userRegister)

Router.post('/userlogin',userLoginController)

Router.post('/signin',requireSignIn,(req,res) => {
    res.status(200).json({ok:true,user:req.user})
})


module.exports = Router;