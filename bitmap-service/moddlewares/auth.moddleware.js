const jwt = require('jsonwebtoken');
const userProfile = require("../models/auth.model");
require('dotenv').config();

const requireSignIn = async (req,res,next) => {
    console.log("Middleware Executed")
    try {
        let token = req.header("Authorization");

        if(!token){
            return res.status(401).json({message:"token is not present"});
        };

        if (token.startsWith("Bearer ")){
            token = token.slice(7);
        };
 

        const decode = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decode;
        // console.log("1111111111",decode)

         
        const user = await userProfile.findById(decode._id).select("-password");  
        // console.log("+++++++++++",user)
         

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        
        
        next();
        
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
        
    }
}

module.exports = {requireSignIn};