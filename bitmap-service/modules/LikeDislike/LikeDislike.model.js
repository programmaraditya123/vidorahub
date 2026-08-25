const db = require("../../config/db2");

const validateLikeDislikeReaction = require("./LikeDislike.Schema");

const LikeDislikeCollection =
    db.collection("like_dislike_event");


// ============================================================
// CREATE / UPDATE REACTION
// ============================================================

const createLikeDislike = async (data) => {

    const document =
        validateLikeDislikeReaction(data);

    return LikeDislikeCollection.replaceOne(
        {
            _id: document._id
        },
        document,
        {
            upsert: true
        }
    );
};


// ============================================================
// DELETE REACTION
// ============================================================

const deleteLikeDislike = async (data) => {

    if (
        data.userSerialNumber === null ||
        data.userSerialNumber === undefined
    ) {
        throw new Error(
            "userSerialNumber is required"
        );
    }

    if (
        data.videoSerialNumber === null ||
        data.videoSerialNumber === undefined
    ) {
        throw new Error(
            "videoSerialNumber is required"
        );
    }

    const _id =
        `${data.userSerialNumber}:${data.videoSerialNumber}`;

    const filter = {
        _id
    };

    // Only delete the requested reaction
    if (data.scope) {
        filter.scope = data.scope;
    }

    return LikeDislikeCollection.deleteOne(
        filter
    );
};


// ============================================================
// GET SINGLE REACTION
// ============================================================

const getLikeDislike = async (
    userSerialNumber,
    videoSerialNumber
) => {

    const _id =
        `${userSerialNumber}:${videoSerialNumber}`;

    return LikeDislikeCollection.findOne({
        _id
    });
};


// ============================================================
// GET USER REACTIONS WITH PAGINATION
// ============================================================

const getUserReactionsByScope = async (
    userSerialNumber,
    scope,
    limit = 20,
    pageState = null
) => {

    const options = {
        limit: 20
    };

    if (pageState) {
        options.initialPageState = pageState;
    }

    const cursor =
        LikeDislikeCollection.find(
            {
                userSerialNumber,
                scope
            },
            options
        );

    const documents =
        await cursor.toArray();

    let nextPageState = null;

    if (
        typeof cursor.getNextPageState ===
        "function"
    ) {
        nextPageState =
            cursor.getNextPageState();
    }

    return {
        documents,
        nextPageState
    };
};


// ============================================================
// GET VIDEO REACTIONS
// Used for rebuilding bitmap
// ============================================================

const getVideoReactionsFromDB = async (
    videoSerialNumber,
    scope
) => {

    const cursor =
        LikeDislikeCollection.find({
            videoSerialNumber,
            scope
        });

    return cursor.toArray();
};


module.exports = {
    createLikeDislike,
    deleteLikeDislike,
    getLikeDislike,
    getUserReactionsByScope,
    getVideoReactionsFromDB
};


// const db = require("../../config/db2");

// const validateLikeDislikeReaction = require("./LikeDislike.Schema");

// const LikeDislikeCollection = db.collection("like_dislike_event");


// const createLikeDislike = async (data) => {

//     const document = validateLikeDislikeReaction(data);

//     return LikeDislikeCollection.replaceOne(
//         {
//             _id: document._id
//         },
//         document,
//         {
//             upsert: true
//         }
//     );
// };


// const deleteLikeDislike = async (data) => {

//     if (
//         data.userSerialNumber === null ||
//         data.userSerialNumber === undefined
//     ) {
//         throw new Error("userSerialNumber is required");
//     }

//     if (
//         data.videoSerialNumber === null ||
//         data.videoSerialNumber === undefined
//     ) {
//         throw new Error("videoSerialNumber is required");
//     }

//     const _id =
//         `${data.userSerialNumber}:${data.videoSerialNumber}`;

//     return LikeDislikeCollection.deleteOne({
//         _id
//     });
// };


// const getLikeDislike = async (
//     userSerialNumber,
//     videoSerialNumber
// ) => {

//     return LikeDislikeCollection.findOne({
//         _id:
//             `${userSerialNumber}:${videoSerialNumber}`
//     });
// };


// const getUserReactionsByScope = async (
//     userSerialNumber,
//     scope
// ) => {

//     const cursor = LikeDislikeCollection.find({
//         userSerialNumber,
//         scope
//     });

//     return cursor.toArray();
// };


// const getVideoReactionsFromDB = async (
//     videoSerialNumber,
//     scope
// ) => {

//     const cursor = LikeDislikeCollection.find({
//         videoSerialNumber,
//         scope
//     });

//     return cursor.toArray();
// };


// module.exports = {
//     createLikeDislike,
//     deleteLikeDislike,
//     getLikeDislike,
//     getUserReactionsByScope,
//     getVideoReactionsFromDB
// };