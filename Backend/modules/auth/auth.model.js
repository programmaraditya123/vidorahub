const mongoose = require('mongoose')

const userProfileSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
    },
    address:{
        type:String,
    },
    subscriber:{
        type:Number,
        default:0
    },
    creator:{
        type:Boolean,
        default:false
    },
    channelname:{
        type:String
    },
    totalviews:{
        type:Number,
        default:0
    },
    totalvideos:{
        type:Number,
        default:0
    },
    uploads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video", // <-- Must match your Video model name
      },
    ],
     role: {
      type: Number,
      enum: [0, 1, 2], //0 = user, 1 = creator, 2 = admin
      default: 0,
    }
},{timestamps:true})

module.exports = mongoose.model("userProfile",userProfileSchema);