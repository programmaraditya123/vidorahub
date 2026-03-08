const userProfile = require("../auth/auth.model");
const { uploadToGCS } = require("../uploadvideo/uploadvideo.helper");

const addBrand = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, category, established, bio } = req.body;

    const updatedBrand = {
      name,
      category,
      established,
      bio,
    };

    const updatedUser = await userProfile.findByIdAndUpdate(
      id,
      updatedBrand,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Brand information updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    // console.error("Error updating brand info:", error);

    return res.status(500).json({
      message: "Internal server error for brand info",
    });
  }
};

const getAllBrands = async (req, res) => {
  try {
    const brands = await userProfile
      .find({ role: 3 })
      .select("name profilePicUrl category location bio")
      .lean();

    res.status(200).json({ brands });
  } catch (error) {
    console.error("Error fetching all brands:", error);
    res.status(500).json({ message: "Internal server error for fetching brands" });
  }
};

const getBrand = async (req, res) => {
  const { brandId } = req.params;
  try {
    const brand = await userProfile
      .findById(brandId)
      .select(
        "name profilePicUrl category location bio",
      );
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json({ brand });
  } catch (error) {
    console.error("Error fetching brand:", error);
    res.status(500).json({ message: "Internal server error for fetching brand" });
  }
};

const addProfilePicture = async (req, res) => {
  try {
    const { id } = req.user;
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const imageUrl = await uploadToGCS(req.file);

    const updatedUser = await userProfile.findByIdAndUpdate(
      id,
      { profilePicUrl: imageUrl },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "Profile picture updated",
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Image upload failed" });
  }
};

const getCreator = async (req, res) => {
  const { id } = req.user;
  try {
    const creator = await userProfile
      .findById(id)
      .select(
        "-password -email -createdAt -role -updatedAt -__v -subscriber -totalviews -totalvideos -uploads -userSerialNumber -channelname",
      );

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    res.status(200).json({ creator });
  } catch (error) {
    // console.error("Error fetching creator:", error);
    res.status(500).json({ message: "Internal server error for basic info" });
  }
};

const addBasicInfo = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, bio, tags, location } = req.body;
    const updatedInfo = {
      name,
      bio,
      tags,
      location,
    };

    const updatedCreator = await userProfile
      .findByIdAndUpdate(id, updatedInfo, { new: true })
      .lean();
    if (!updatedCreator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    res.status(200).json({ creator: updatedCreator });
  } catch (error) {
    console.error("Error updating creator basic info:", error);
    res.status(500).json({ message: "Internal server error for basic info" });
  }
};

const addCreatorPlatform = async (req, res) => {
  try {
    const { id } = req.user;
    const { platform, url, audience } = req.body;

    const creator = await userProfile.findById(id);

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const existingPlatform = creator.platforms.find(
      (p) => p.platform === platform,
    );

    if (existingPlatform) {
      // update only provided fields
      if (url !== undefined) {
        existingPlatform.url = url;
      }

      if (audience !== undefined) {
        existingPlatform.audience = audience;
      }

      await creator.save();

      return res.status(200).json({
        creator,
        message: "Platform updated successfully",
      });
    }

    // ADD new platform
    creator.platforms.push({
      platform,
      url,
      audience,
    });

    await creator.save();

    res.status(200).json({
      creator,
      message: "Platform added successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error for platform info",
    });
  }
};

const addShowcaseContent = async (req, res) => {
  try {
    const { id } = req.user;
    const { title, platform, link, views } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "No Thumbnail uploaded" });
    }
    const thumbnailUrl = await uploadToGCS(req.file);
    const creator = await userProfile.findById(id);

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    creator.showCaseContent.push({
      thumbnailUrl,
      title,
      platform,
      link,
      views,
    });
    await creator.save();

    res.status(200).json({
      message: "Showcase content added successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error for showcase content",
    });
  }
};

const deleteShowcaseContent = async (req, res) => {
  try {
    const { id } = req.user;
    const { contentId } = req.params;

    const creator = await userProfile.findById(id);

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const contentIndex = creator.showCaseContent.findIndex(
      (content) => content._id.toString() === contentId,
    );

    if (contentIndex === -1) {
      return res.status(404).json({ message: "Showcase content not found" });
    }

    creator.showCaseContent.splice(contentIndex, 1);
    await creator.save();

    res.status(200).json({
      message: "Showcase content deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error for showcase content",
    });
  }
};

const addExperience = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, campaign, status, deliverables } = req.body;
    const creator = await userProfile.findById(id);

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    creator.experience.push({
      name,
      campaign,
      status,
      deliverables,
    });
    await creator.save();
    res.status(200).json({
      message: "Experience added successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error for experience",
    });
  }
};

const deleteExperience = async (req, res) => {
  try {
    const { id } = req.user;
    const { experienceId } = req.params;
    const creator = await userProfile.findById(id);

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    const experienceIndex = creator.experience.findIndex(
      (exp) => exp._id.toString() === experienceId,
    );

    if (experienceIndex === -1) {
      return res.status(404).json({ message: "Experience not found" });
    }

    creator.experience.splice(experienceIndex, 1);
    await creator.save();

    res.status(200).json({
      message: "Experience deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error for experience",
    });
  }
};

const getAllCreators = async (req, res) => {
  try {
    const { name, niche, location, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const skip = (pageNum - 1) * limitNum;

    /* BASE QUERY */

    const query = {
      role: 1,
      location: { $exists: true, $ne: "" },
    };

    /* NAME SEARCH */

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    /* NICHE FILTER */

    if (niche && niche !== "All Niches") {
      query.tags = { $regex: niche, $options: "i" };
    }

    /* LOCATION FILTER */

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const creators = await userProfile
      .find(query)
      .select("name profilePicUrl location tags platforms bio")
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalCreators = await userProfile.countDocuments(query);

    const totalPages = Math.ceil(totalCreators / limitNum);

    res.status(200).json({
      creators,
      pagination: {
        total: totalCreators,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error for getting creators",
    });
  }
};

const getOneCreator = async (req, res) => {
  const { creatorId } = req.params;
  try {
    const creator = await userProfile
      .findById(creatorId)
      .select(
        "-password -email -createdAt -role -updatedAt -__v -subscriber -totalviews -totalvideos -uploads -userSerialNumber -channelname",
      );
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    res.status(200).json({ creator });
  } catch (error) {
    console.error("Error fetching creator:", error);
    res.status(500).json({ message: "Internal server error for fetching creator" });
  }
};

module.exports = {
  addBrand,
  addProfilePicture,
  getCreator,
  addBasicInfo,
  addCreatorPlatform,
  addShowcaseContent,
  deleteShowcaseContent,
  addExperience,
  deleteExperience,
  getAllCreators,
  getAllBrands,
  getBrand,
  getOneCreator

};
