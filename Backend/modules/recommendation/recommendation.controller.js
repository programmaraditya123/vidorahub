const Video = require('../uploadvideo/uploadvideo.model')

const getHomeFeed = async (req,res) => {
    // const {id} = req.user;
    const {category} = req.body;

    const filter = {
        isDeleted : false
    }

    if(category){
        filter.$or = [
            {title : {$regex:category ,$options : 'i'}},
            {description : {$regex : category  , $options : 'i'}},
            // {tags : {$regex : category  , options : 'i'}},
            // {aitags : {$regex : category , options : 'i'}}

        ]
    }
    try{
        const videos = await Video.find(filter)
        .select("-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes")
        .populate({ path: "uploader", select: "name _id profilePicUrl" })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()


        res.json({
            success : true,
            message : 'video fetched successfully',
            length : videos.length,
            data : videos
        })

    }
    catch(error){
        console.log("Error",error)
        return res.status(500).json({
            success : false,
            message : "Unable to fetch videos"
        })

    }
}

module.exports = {getHomeFeed}