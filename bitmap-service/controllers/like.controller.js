const {
  existsInBitmap,
  removeFromBitmap,
  addToBitmap,
  countBitmap,
} = require("../services/roaring.service");

const redis = require("../config/redis");


const addLike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.body;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    if (existsInBitmap(likeKey, userSerialNumber)) {
      return res.json({
        success: true,
        liked: true,
        disliked: false,
        likes: countBitmap(likeKey),
        dislikes: countBitmap(dislikeKey),
      });
    }

    if (existsInBitmap(dislikeKey, userSerialNumber)) {
      removeFromBitmap(dislikeKey, userSerialNumber);
    }

    addToBitmap(likeKey, userSerialNumber);

    res.json({
      success: true,
      liked: true,
      disliked: false,
      likes: countBitmap(likeKey),
      dislikes: countBitmap(dislikeKey),
    });
  } catch (error) {
    res.status(500).json({ error: "Like failed" });
  }
};



const removeLike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.body;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    removeFromBitmap(likeKey, userSerialNumber);

    res.json({
      success: true,
      liked: false,
      disliked: false,
      likes: countBitmap(likeKey),
      dislikes: countBitmap(dislikeKey),
    });
  } catch (error) {
    res.status(500).json({ error: "Remove like failed" });
  }
};


 
const addDislike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.body;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    if (existsInBitmap(dislikeKey, userSerialNumber)) {
      return res.json({
        success: true,
        liked: false,
        disliked: true,
        likes: countBitmap(likeKey),
        dislikes: countBitmap(dislikeKey),
      });
    }

    if (existsInBitmap(likeKey, userSerialNumber)) {
      removeFromBitmap(likeKey, userSerialNumber);
    }

    addToBitmap(dislikeKey, userSerialNumber);

    res.json({
      success: true,
      liked: false,
      disliked: true,
      likes: countBitmap(likeKey),
      dislikes: countBitmap(dislikeKey),
    });
  } catch (error) {
    res.status(500).json({ error: "Dislike failed" });
  }
};


 
const removeDislike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.body;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    removeFromBitmap(dislikeKey, userSerialNumber);

    res.json({
      success: true,
      liked: false,
      disliked: false,
      likes: countBitmap(likeKey),
      dislikes: countBitmap(dislikeKey),
    });
  } catch (error) {
    res.status(500).json({ error: "Remove dislike failed" });
  }
};


 
const validateeLikeDislike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.query;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    const liked = existsInBitmap(likeKey, Number(userSerialNumber));
    const disliked = existsInBitmap(dislikeKey, Number(userSerialNumber));

    res.json({
      success: true,
      liked,
      disliked,
    });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
};

const getVideoReactions = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.query;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    const liked = existsInBitmap(likeKey, Number(userSerialNumber));
    const disliked = existsInBitmap(dislikeKey, Number(userSerialNumber));

    res.json({
      success: true,
      liked,
      disliked,
      likes: countBitmap(likeKey),
      dislikes: countBitmap(dislikeKey),
    });
  } catch (error) {
    console.log("error",error)
    res.status(500).json({ error: "Fetch reactions failed" });
  }
};


module.exports = {
  addLike,
  removeLike,
  addDislike,
  removeDislike,
  validateeLikeDislike,
  getVideoReactions
};
