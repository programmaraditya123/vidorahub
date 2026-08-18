
const validateCategorySelectEvent = (data) => {

    if (!data.eventId) {
        throw new Error("eventId is required");
    }

    if (!data.categorySelected) {
        throw new Error("categorySelected is required");
    }

    if (
        data.userId !== null &&
        data.userId !== undefined &&
        typeof data.userId !== "string"
    ) {
        throw new Error("userId must be a string or null");
    }

    if (
        data.profileId !== null &&
        data.profileId !== undefined &&
        typeof data.profileId !== "string"
    ) {
        throw new Error("profileId must be a string or null");
    }

    if (
        data.sessionId !== null &&
        data.sessionId !== undefined &&
        typeof data.sessionId !== "string"
    ) {
        throw new Error("sessionId must be a string or null");
    }

    return {
        eventId: data.eventId,
        categorySelected: data.categorySelected,

        userId: data.userId ?? null,
        profileId: data.profileId ?? null,
        sessionId: data.sessionId ?? null,

        createdAt: new Date()
    };
};

module.exports = validateCategorySelectEvent;