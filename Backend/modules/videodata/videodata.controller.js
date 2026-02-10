const mongoose = require('mongoose')
const Video = require('../uploadvideo/uploadvideo.model')
const Comment = require('./videodata.model')
const Profile = require('../auth/auth.model')


const getVedioDataExceptCommentsDocs = async (req,res) => {
    try {
        const {id} = req.params;
        const data = await Video.findById(id)
        .select("-videoUrl -updatedAt -category -_id")
        .populate({path : "uploader" , select : "name subscriber userSerialNumber"})
        res.json({
            ok : true,
            data
        })

        
    } catch (error) {
        res.status(500).json({ok : false ,message : 'failed to fetch videometadata'})
        
    }
}

const getVedioDocs = (req,res) => {
    try {
        
    } catch (error) {
        
    }
}

const postVedioComments = async (req,res) => {
    try {
        const {videoId} = req.params;
        const {content,parentComment} = req.body;
        const userId = req.user.id;

        if(!content || !content.trim()){
            return res.status(400).json({
                success : false,
                message : "Comment content is required"
            })
        }

    const video = await Video.findById({_id : videoId}).select("_id visibility");
    // console.log("Vedioo",video)

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (video.visibility === "private") {
      return res.status(403).json({
        success: false,
        message: "Comments are disabled for this video",
      });
    }
        if(parentComment){
            const parent = await Comment.findById(parentComment).select("_id video")
            if(!parent || parent.video.toString() !== videoId){
                return res.status(400).json({
                    success : false,
                    message : "Invalid parent comment"
                })
            }
        }

        const comment = await Comment.create({
            video : videoId ,
            user : userId,
            content : content.trim(),
            parentComment : parentComment || null
        })
        
        if(!parentComment){
            await Video.findByIdAndUpdate(videoId , {$inc : {"stats.comments" : 1}})
        }

        return res.status(201).json({
            success : true ,
            message : "Comments posted successfully",
            data : comment,
        })

        
    } catch (error) {
        return res.status(500).json({
            success : false ,
            message : "failed to post comments"
        })
        
    }
}

const getVedioComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const comments = await Comment.find({
      video: videoId,
      parentComment: null,
    })
      .sort({ createdAt: -1 })
      .select("-isEdited -isPinned -updatedAt -__v")
      .skip(skip)
      .limit(limit)
      .populate("user", "username avatar name")
      .lean();

    const commentIds = comments.map((c) => c._id);

    const replies = await Comment.find({
      parentComment: { $in: commentIds },
    })
      .sort({ createdAt: 1 })
      .select("-isEdited -isPinned -updatedAt -__v")
      .populate("user", "username avatar name")
      .lean();

    const repliesMap = {};
    replies.forEach((reply) => {
      if (!repliesMap[reply.parentComment]) {
        repliesMap[reply.parentComment] = [];
      }
      repliesMap[reply.parentComment].push(reply);
    });

    const commentsWithReplies = comments.map((comment) => ({
      ...comment,
      replies: repliesMap[comment._id] || [],
    }));

    const totalComments = await Comment.countDocuments({
      video: videoId,
      parentComment: null,
    });

    return res.status(200).json({
      success: true,
      data: commentsWithReplies,
      pagination: {
        total: totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
        hasNextPage: page * limit < totalComments,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
};


const getNextVideos = async (req, res) => {
  try {
    const {
      search = "",
      excludeVideoId,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const query = {
      visibility: "public",
      isDeleted: { $ne: true }
    };

    if (search.trim()) {
      query.title = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    if (
      excludeVideoId &&
      mongoose.Types.ObjectId.isValid(excludeVideoId)
    ) {
      query._id = { $ne: excludeVideoId };
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })  
      .skip(skip)
      .limit(Number(limit))
      .select("title thumbnailUrl duration stats.views uploader createdAt videoUrl")
      .populate("uploader", "-_id name")
      .lean();

    const total = await Video.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: videos,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch next videos",
    });
  }
};


const getCreatorProfileData = async (req,res) => {
  try {
    if(!req.user?._id){
      return res.status(401).json({success : false , message : "Please Login first"})
    }
    const id = req.user._id;

    const data = await Profile.findById(id).select("-email -password -__v").populate({path : "uploads", 
      options : {sort : {createdAt : -1}},
      select : "-description -stats.likes -stats.dislikes -stats.comments -category -tags -updatedAt -__v -uploader"
    })
      

    return res.status(200).json({
      success : true ,
      message : "Creator data fetched successfully",
      data : data
    })
    
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "unable to fetch creator"
    })
    
  }
}


const getCreatorChannel = async (req,res) => {
  try {
    
    const {id }= req.params;
    if(!id){
      return res.status(401).json({success : false , message : "Please provide creator id"})
    }

    const data = await Profile.findById(id).select("-email -password -__v").populate({path : "uploads", 
      options : {sort : {createdAt : -1}},
      select : "-description -stats.likes -stats.dislikes -stats.comments -category -tags -updatedAt -__v -uploader"
    })
      

    return res.status(200).json({
      success : true ,
      message : "Creator data fetched successfully",
      data : data
    })
    
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "unable to fetch creator"
    })
    
  }
}


const deleteVideo = async (req,res) => {
  try {
    if(!req.user?._id){
      return res.status(401).json({success : false , message : "Please Login first"})
    }
    const id = req.user?.id;
    const {videoId} = req.body;
    
    if(!videoId){
      return res.status(401).json({success : false , message : "vedio is not available"})
    }

    const data = await Video.findById(videoId)
    if(!data){
      return res.status(404).json({
        success : false ,
        message : "Vedio not found"
      })
    }

    if(data.uploader.toString() !== id.toString()){
      return res.status(403).json({
        success : false ,
        message : "you are not allowed to delete this video"
      })
    }

    // data.isDeleted = true;
    // await video.save()
    session = await mongoose.startSession();
    await session.withTransaction(async () => {

      await Video.findByIdAndUpdate(videoId,
        {$set : {isDeleted : true}},
        {session}
      )

      await Profile.findByIdAndUpdate(id ,
        {
          $pull : {uploads : videoId},
          $inc : {totalvideos : -1}
        },
        {session}
      )
    })
    if (session) session.endSession();

    return res.status(200).json({
      success : true,
      message : "video Deleted Successfully"
    })



  } catch (error) {
    return res.status(500).json({success : false , message : "unable to delete this video"})
    
  } finally {
    if (session) session.endSession();
  }
}


module.exports = {getVedioDataExceptCommentsDocs,getVedioComments,getVedioDocs,
    getNextVideos,postVedioComments,getCreatorProfileData,deleteVideo,getCreatorChannel}