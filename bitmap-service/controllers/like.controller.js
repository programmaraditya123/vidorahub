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

    if (await existsInBitmap(likeKey, userSerialNumber)) {
      return res.json({
        success: true,
        liked: true,
        disliked: false,
        likes: await countBitmap(likeKey),
        dislikes: await countBitmap(dislikeKey),
      });
    }

    if (await existsInBitmap(dislikeKey, userSerialNumber)) {
      await removeFromBitmap(dislikeKey, userSerialNumber);
    }

    await addToBitmap(likeKey, userSerialNumber);

    res.json({
      success: true,
      liked: true,
      disliked: false,
      likes: await countBitmap(likeKey),
      dislikes: await countBitmap(dislikeKey),
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

    await removeFromBitmap(likeKey, userSerialNumber);

    res.json({
      success: true,
      liked: false,
      disliked: false,
      likes: await countBitmap(likeKey),
      dislikes: await countBitmap(dislikeKey),
    });
  } catch {
    res.status(500).json({ error: "Remove like failed" });
  }
};


 
const addDislike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.body;

    const likeKey = `video:${videoSerialNumber}:likes`;
    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    if (await existsInBitmap(dislikeKey, userSerialNumber)) {
      return res.json({
        success: true,
        liked: false,
        disliked: true,
        likes: await countBitmap(likeKey),
        dislikes: await countBitmap(dislikeKey),
      });
    }

    if (await existsInBitmap(likeKey, userSerialNumber)) {
      await removeFromBitmap(likeKey, userSerialNumber);
    }

    await addToBitmap(dislikeKey, userSerialNumber);

    res.json({
      success: true,
      liked: false,
      disliked: true,
      likes: await countBitmap(likeKey),
      dislikes: await countBitmap(dislikeKey),
    });
  } catch {
    res.status(500).json({ error: "Dislike failed" });
  }
};



 
const removeDislike = async (req, res) => {
  try {
    const { userSerialNumber, videoSerialNumber } = req.body;

    const dislikeKey = `video:${videoSerialNumber}:dislikes`;

    await removeFromBitmap(dislikeKey, userSerialNumber);

    res.json({
      success: true,
      liked: false,
      disliked: false,
      likes: await countBitmap(`video:${videoSerialNumber}:likes`),
      dislikes: await countBitmap(dislikeKey),
    });
  } catch {
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

    let liked = false;
    let disliked = false;

    if (userSerialNumber) {
      const userId = Number(userSerialNumber);
      liked = await existsInBitmap(likeKey, userId);
      disliked = await existsInBitmap(dislikeKey, userId);
    }

    res.json({
      success: true,
      liked,
      disliked,
      likes: await countBitmap(likeKey),
      dislikes: await countBitmap(dislikeKey),
    });
  } catch (error) {
    console.log(error)
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
