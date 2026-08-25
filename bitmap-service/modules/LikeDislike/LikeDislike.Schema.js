const validateLikeDislikeReaction = (data) => {

    if (
        data.userSerialNumber === null ||
        data.userSerialNumber === undefined
    ) {
        throw new Error("userSerialNumber is required");
    }

    if (
        typeof data.userSerialNumber !== "number" ||
        !Number.isInteger(data.userSerialNumber) ||
        data.userSerialNumber < 0
    ) {
        throw new Error(
            "userSerialNumber must be a positive integer"
        );
    }

    if (
        data.videoSerialNumber === null ||
        data.videoSerialNumber === undefined
    ) {
        throw new Error("videoSerialNumber is required");
    }

    if (
        typeof data.videoSerialNumber !== "number" ||
        !Number.isInteger(data.videoSerialNumber) ||
        data.videoSerialNumber < 0
    ) {
        throw new Error(
            "videoSerialNumber must be a positive integer"
        );
    }

    if (!data.scope) {
        throw new Error("scope is required");
    }

    const validScopes = ["like", "dislike"];

    if (!validScopes.includes(data.scope)) {
        throw new Error(
            `scope must be one of: ${validScopes.join(", ")}`
        );
    }

    return {
        _id: `${data.userSerialNumber}:${data.videoSerialNumber}`,

        userSerialNumber: data.userSerialNumber,
        videoSerialNumber: data.videoSerialNumber,

        scope: data.scope,

        updatedAt: new Date()
    };
};

module.exports = validateLikeDislikeReaction;