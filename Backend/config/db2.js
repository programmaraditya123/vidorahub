const { DataAPIClient } = require("@datastax/astra-db-ts");
require("dotenv").config();

const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN);

const db = client.db(process.env.ASTRA_DB_ENDPOINT);

async function testConnection() {
  try {
    const collections = await db.listCollections();
    console.log("✅ Connected to AstraDB:", collections);
  } catch (err) {
    console.error("❌ AstraDB connection failed:", err.message);
  }
}

testConnection();

module.exports = db;
