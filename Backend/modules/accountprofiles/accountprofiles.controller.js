const accountProfile = require('./accountprofiles.model')
const userProfile = require('../auth/auth.model')
const mongoose = require('mongoose')


const createProfile = async (req, res) => {
    try {
        const { id: accountId } = req.user;
        const { name, dateOfBirth, isPrimary, pinHash } = req.body;
        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: "accountid is required"
            })
        }
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid accountId",
            });
        }

        const accountExists = await userProfile.exists({
            _id: accountId,
            isDeleted: false
        })
        if (!accountExists) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Profile name is required"
            })
        }
        const normalizedName = name.trim();

        const existingProfile = await accountProfile.findOne({
            accountId,
            name: {
                $regex: `^${normalizedName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )}$`,
                $options: "i",
            },
            isDeleted: false,
        }).lean();

        if (existingProfile) {
            return res.status(409).json({
                success: false,
                message: "A profile with this name already exists",
            });
        }

        const profileCount = await accountProfile.countDocuments({
            accountId,
            isDeleted: false,
        });

        let makePrimary = Boolean(isPrimary);

        if (profileCount === 0) {
            makePrimary = true;
        }
        if (makePrimary) {
            await accountProfile.updateMany(
                {
                    accountId,
                    isDeleted: false,
                    isPrimary: true,
                },
                {
                    $set: {
                        isPrimary: false,
                    },
                }
            );
        }

        await accountProfile.updateMany(
            {
                accountId,
                isDeleted: false,
            },
            {
                $set: {
                    isActive: false,
                },
            }
        );

        const profile = await accountProfile.create({
            accountId,
            name: normalizedName,
            dateOfBirth: dateOfBirth || undefined,
            isPrimary: makePrimary,
            isActive: true,
            isDeleted: false,

            pinHash: pinHash || undefined,
        })

        return res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: profile,
        });


    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: "Unable to create profile at the moment",
        })

    }
}

const getProfiles = async (req, res) => {
    try {
        const { id: accountId } = req.user;

        if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication",
            });
        }

        const profiles = await accountProfile.find({
            accountId,
            isDeleted: false,
        })
            .select(
                "accountId name isPrimary isActive profilePicUrl _id profileType isKidsProfile"
            )
            .sort({
                isPrimary: -1,
                createdAt: 1,
            })
            .lean();

        if (!profiles.length) {
            return res.status(200).json({
                success: true,
                message: "No profiles found",
                data: [],
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profiles loaded successfully",
            data: profiles,
        });


    } catch (error) {
        console.log(error)
        return res.status(500).send({
            success: false,
            message: "Unable to load profiles"
        })

    }
}

const switchProfile = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id: accountId } = req.user;
        const { profileId } = req.body;

   
        if (
            !accountId ||
            !mongoose.Types.ObjectId.isValid(accountId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication",
            });
        }

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: "profileId is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid profileId",
            });
        }

        session.startTransaction();

        const profile = await accountProfile.findOne({
            _id: profileId,
            accountId,
            isDeleted: false,
        })
            .select(
                "accountId name isPrimary profilePicUrl _id profileType isKidsProfile"
            )
            .session(session)
            .lean();

        if (!profile) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });
        }

      
        await accountProfile.updateMany(
            {
                accountId,
                isDeleted: false,
            },
            {
                $set: {
                    isActive: false,
                },
            },
            {
                session,
            }
        );

        await accountProfile.updateOne(
            {
                _id: profileId,
                accountId,
                isDeleted: false,
            },
            {
                $set: {
                    isActive: true,
                },
            },
            {
                session,
            }
        );

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Profile switched successfully",
            data: {
                ...profile,
                isActive: true,
            },
        });

    } catch (error) {
        await session.abortTransaction();

        console.error("switchProfile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to switch profile at this moment",
        });

    } finally {
        await session.endSession();
    }
};
module.exports = { createProfile, getProfiles, switchProfile }
