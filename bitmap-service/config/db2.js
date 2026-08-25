//This db is using DATAAPI client not native cassandra driver

const { DataAPIClient } = require("@datastax/astra-db-ts");
require("dotenv").config();

const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN);

const db = client.db(process.env.ASTRA_DB_ENDPOINT);

async function testConnection() {
  try {
    const collections = await db.listCollections();
    const collectionNames = collections.map(c => c.name);
    console.log("✅ Connected to AstraDB:CollectionNames",collectionNames);
  } catch (err) {
    console.error("❌ AstraDB connection failed:", err.message);
  }
}

async function initAstra() {
    try {

        try {
            await db.createCollection("category_select_events");
        } catch (error) {
            if (!error.message?.includes("already exists")) {
                throw error;
            }
        }

        try {
            await db.createCollection("like_dislike_event");
        } catch (error) {
            if (!error.message?.includes("already exists")) {
                throw error;
            }
        }

        const collection =
            db.collection("like_dislike_event");

        try {
            await collection.createIndex(
                "userSerialNumber"
            );
        } catch (error) {
            console.log(
                "userSerialNumber index:",
                error.message
            );
        }

        try {
            await collection.createIndex(
                "videoSerialNumber"
            );
        } catch (error) {
            console.log(
                "videoSerialNumber index:",
                error.message
            );
        }

        try {
            await collection.createIndex(
                "scope"
            );
        } catch (error) {
            console.log(
                "scope index:",
                error.message
            );
        }

        console.log(
            "✅ Astra initialization completed"
        );

    } catch (error) {

        console.error(
            "❌ Astra initialization failed:",
            error
        );

        throw error;
    }
}
testConnection();
// initAstra();

module.exports = db;
