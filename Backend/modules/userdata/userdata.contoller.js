const userProfile = require('../auth/auth.model');

const getUserProfileData = async (req,res) => {
    try {
        const {id} = req.user;
        const userData = await userProfile.findById(id).select("-password -createdAt -email -role -updatedAt -__v  -totalviews  -uploads -userSerialNumber -tags -platforms -showCaseContent -experience");
        res.status(200).json({userData});
    } catch (error) {
        console.log("Error in getting user profile data",error);
        res.status(500).json({message:"Internal server error"});
        
    }
}

module.exports = {getUserProfileData};