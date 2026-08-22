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
        await db.createCollection("category_select_events");

        console.log(
            "✅ category_select_events collection created"
        );
    } catch (error) {

        // Collection already exists
        if (
            error.message?.includes("already exists")
        ) {
            console.log(
                "✅ category_select_events already exists"
            );
        } else {
            console.error(
                "❌ Astra initialization failed:",
                error
            );

            throw error;
        }
      }
    }

testConnection();
// initAstra();

module.exports = db;
