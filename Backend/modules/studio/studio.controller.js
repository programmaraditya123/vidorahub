const userProfile = require("../auth/auth.model");
const { uploadToGCS } = require("../uploadvideo/uploadvideo.helper");

const addBrand = (req, res) => {
  try {
  } catch (error) {}
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
};
