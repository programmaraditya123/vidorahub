const userProfile = require('./auth.model')
const {hashPassword,comparePassword} = require('./auth.helper')
const jwt = require('jsonwebtoken')
require("dotenv").config();

const userRegister = async(req,res) => {
    try {
        const {name,email,password} = req.body;
        if(!name){
            return res.send({message:'Name is required'})
        }
        if(!email){
            return res.send({message:'Email is required'})
        }
        if(!password){
            return res.send({message:'Password is required'})
        }

        const userExists = await userProfile.findOne({email})
        if(userExists){
            return res.status(200).json({
                success:false,
                message:'Already registered please login'
            })
        }

        const hashedPassword = await hashPassword(password);
        //save to db
        const user =  await new userProfile({name,email,password:hashedPassword}).save()

        res.status(200).json({
            success:true,
            message:'user registred successfully',
            user
        })
        
    } catch (error) {
        console.log("Error while registering",error)
        res.status(500).json({
            success:false,
            message:'Error in registration',error
        })
        
    }
}

//login controller for user login
const userLoginController = async (req,res) => {
    const {email,password} = req.body;
    try {
        if(!email || !password){
            res.status(404).send({
                success:false,
                message:"Invalid username and password"
            })
        }

        //check user whether already registered or not
        const user = await userProfile.findOne({email})
        if(!user){
            return res.status(404).send({
                success:false,
                message:"Email is not registred"
            })
        }
        console.log("8888888888",user)

        const match = await comparePassword(password,user.password)
        if(!match){
            return res.status(200).send({
                success:false,
                message:"Wrong password"
            }) 
        }

        const token = await jwt.sign({_id:user._id},process.env.JWT_SECRET,{expiresIn:"7d"})

        return res.status(200).send({
            success:true,
            message:"LoggedIn Successfully",
            user:{
                name:user.name,
                email:user.email
            },
            token
        })


        
    } catch (error) {
        console.log("error",error)
        
    }
}
module.exports = {userRegister,userLoginController}