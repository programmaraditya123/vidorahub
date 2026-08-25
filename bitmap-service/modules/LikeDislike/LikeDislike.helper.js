const { addToBitmap, existsInBitmap, countBitmap } = require("../../services/roaring.service");
const { getVideoReactionsFromDB } = require("./LikeDislike.model");
const redis = require("../../config/redis");

const rebuildBitmapFromAstra = async (
    videoSerialNumber,
    scope
) => {

    const key =
        `video:${videoSerialNumber}:${scope}s`;

    const documents =
        await getVideoReactionsFromDB(
            videoSerialNumber,
            scope
        );

    /*
     * Delete broken bitmap first.
     */

    await redis.del(key);

    /*
     * Rebuild from durable Astra data.
     */

    for (const document of documents) {

        await addToBitmap(
            key,
            Number(document.userSerialNumber)
        );
    }

    return key;
};


const safeExistsInBitmap = async (
    key,
    userSerialNumber,
    videoSerialNumber,
    scope
) => {

    try {

        return await existsInBitmap(
            key,
            userSerialNumber
        );

    } catch (error) {

        console.error(
            `Bitmap failed: ${key}`,
            error.message
        );

        await rebuildBitmapFromAstra(
            videoSerialNumber,
            scope
        );

        return await existsInBitmap(
            key,
            userSerialNumber
        );
    }
};

const safeCountBitmap = async (
    key,
    videoSerialNumber,
    scope
) => {

    try {

        return await countBitmap(key);

    } catch (error) {

        console.error(
            `Bitmap count failed: ${key}`,
            error.message
        );

        await rebuildBitmapFromAstra(
            videoSerialNumber,
            scope
        );

        return await countBitmap(key);
    }
};


const getUserReactionsByScope = async (
    userSerialNumber,
    scope,
    limit = 20,
    pageState = null
) => {

    const options = {
        limit: 20,
        sort: {
            updatedAt: -1
        }
    };

    if (pageState) {
        options.initialPageState = pageState;
    }

    const cursor = LikeDislikeCollection.find(
        {
            userSerialNumber,
            scope
        },
        options
    );

    const documents = await cursor.toArray();

    return {
        documents,
        nextPageState:
            typeof cursor.getNextPageState === "function"
                ? cursor.getNextPageState()
                : null
    };
};


module.exports = {rebuildBitmapFromAstra,safeExistsInBitmap,safeCountBitmap,getUserReactionsByScope}