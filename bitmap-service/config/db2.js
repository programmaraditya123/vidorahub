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

testConnection();

module.exports = db;
