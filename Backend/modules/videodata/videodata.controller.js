const mongoose = require('mongoose')
const Video = require('../uploadvideo/uploadvideo.model')


const getVedioDataExceptCommentsDocs = async (req,res) => {
    try {
        const {id} = req.params;
        const data = await Video.findById(id)
        .select("-videoUrl -updatedAt -category -thumbnailUrl -_id")
        .populate({path : "uploader" , select : "name subscriber"})
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

const getVedioComments = (req,res) => {
    try {
        
    } catch (error) {
        
    }
}


const getNextVideos = (req,res) => {
    try {
        
    } catch (error) {
        
    }
}
module.exports = {getVedioDataExceptCommentsDocs,getVedioComments,getVedioDocs,getNextVideos}