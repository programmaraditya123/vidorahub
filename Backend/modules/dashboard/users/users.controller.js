const userProfile = require("../../auth/auth.model");

const allUsers = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      search = "",
      sort = "newest",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const [
      totalUsers,
      deletedUsers,
      blockedUsers,
      premiumUsers,
      activeUsers,
    ] = await Promise.all([
      userProfile.countDocuments(),

      userProfile.countDocuments({
        isDeleted: true,
      }),

      userProfile.countDocuments({
        isBlocked: true,
        isDeleted: false,
      }),

      userProfile.countDocuments({
        isPremium: true,
        isDeleted: false,
      }),

      userProfile.countDocuments({
        isDeleted: false,
        isBlocked: false,
      }),
    ]);

    const filter = {
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    };

    let sortObj = {};

    switch (sort) {
      case "active":
        filter.isDeleted = false;
        filter.isBlocked = false;
        sortObj = { createdAt: -1 };
        break;

      case "blocked":
        filter.isBlocked = true;
        filter.isDeleted = false;
        sortObj = { createdAt: -1 };
        break;

      case "premium":
        filter.isPremium = true;
        filter.isDeleted = false;
        sortObj = { createdAt: -1 };
        break;

      case "oldest":
        sortObj = { createdAt: 1 };
        break;

      case "newest":
      default:
        sortObj = { createdAt: -1 };
    }


    const users = await userProfile
      .find(filter)
      .select("-password -bio -showCaseContent -experience -updatedAt -createdAt -platforms -uploads -tags -__v -location")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalFilteredUsers = await userProfile.countDocuments(filter);

    return res.status(200).json({
      success: true,

      counts: {
        totalUsers,
        activeUsers,
        blockedUsers,
        premiumUsers,
        deletedUsers,
      },

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFilteredUsers / limit),
        totalUsers: totalFilteredUsers,
        limit,
        hasNextPage: page * limit < totalFilteredUsers,
        hasPrevPage: page > 1,
      },

      users,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const userAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const user = await userProfile.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    switch (action) {
      case "block":
        user.isBlocked = true;
        break;

      case "unblock":
        user.isBlocked = false;
        break;

      case "premium":
        user.isPremium = true;
        break;

      case "removePremium":
        user.isPremium = false;
        break;

      case "delete":
        user.isDeleted = true;
        break;

      case "restore":
        user.isDeleted = false;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action",
        });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${action} successful`,
      user,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { allUsers , userAction };