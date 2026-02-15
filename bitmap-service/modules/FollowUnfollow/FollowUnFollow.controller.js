const userProfile = require("../../models/auth.model");
const Subscription = require("./followunfollow.model");

const {
  addToBitmap,
  removeFromBitmap,
  existsInBitmap,
  countBitmap,
} = require("../../services/roaring.service");

const getKey = (creatorSerialNumber) =>
  `creator:${creatorSerialNumber}:followers`;


/*
GET FOLLOW STATUS
*/
const getReaction = async (req, res) => {
  try {
    const userSerialNumber = Number(req.query.userserialnumber);
    const creatorSerialNumber = Number(req.query.creatorserialnumber);

    if (!userSerialNumber || !creatorSerialNumber) {
      return res.status(400).json({ message: "Missing serial numbers" });
    }

    const key = getKey(creatorSerialNumber);

    const following = await existsInBitmap(key, userSerialNumber);

    res.json({ following });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*
FOLLOW CREATOR
*/
const addFollow = async (req, res) => {
  try {
    const creatorId = req.params.creatorid;
    const userId = req.user._id;

    const { userSerialNumber, creatorSerialNumber } = req.body;

    if (!userSerialNumber || !creatorSerialNumber) {
      return res.status(400).json({ message: "Serial numbers required" });
    }

    if (String(userId) === String(creatorId)) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const key = getKey(creatorSerialNumber);

    const alreadyFollowing = await existsInBitmap(
      key,
      userSerialNumber
    );

    if (alreadyFollowing) {
      return res.json({ message: "Already following" });
    }

    /*
      STEP 1 — bitmap update (source of truth)
    */
    const totalSubscribers = await addToBitmap(
      key,
      userSerialNumber
    );

    /*
      STEP 2 — mongo relationship store
    */
    await Subscription.create({
      userId,
      creatorId,
      userSerialNumber,
      creatorSerialNumber,
    });

    /*
      STEP 3 — update cached count
    */
    await userProfile.findByIdAndUpdate(creatorId, {
      subscriber: totalSubscribers,
    });

    res.json({
      message: "Followed successfully",
      totalSubscribers,
    });
  } catch (error) {
    console.error("FOLLOW ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};


/*
UNFOLLOW CREATOR
*/
const addUnFollow = async (req, res) => {
  try {
    const creatorId = req.params.creatorid;
    const userId = req.user._id;

    const { userSerialNumber, creatorSerialNumber } = req.body;

    if (!userSerialNumber || !creatorSerialNumber) {
      return res.status(400).json({ message: "Serial numbers required" });
    }

    const key = getKey(creatorSerialNumber);

    const exists = await existsInBitmap(
      key,
      userSerialNumber
    );

    if (!exists) {
      return res.json({ message: "Not following" });
    }

    /*
      STEP 1 — bitmap update
    */
    const totalSubscribers = await removeFromBitmap(
      key,
      userSerialNumber
    );

    /*
      STEP 2 — remove mongo record
    */
    await Subscription.deleteOne({
      userSerialNumber,
      creatorSerialNumber,
    });

    /*
      STEP 3 — update cached count
    */
    await userProfile.findByIdAndUpdate(creatorId, {
      subscriber: totalSubscribers,
    });

    res.json({
      message: "Unfollowed",
      totalSubscribers,
    });
  } catch (error) {
    console.error("UNFOLLOW ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getReaction,
  addFollow,
  addUnFollow,
};
