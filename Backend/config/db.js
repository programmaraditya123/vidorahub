const mongoose = require('mongoose');
require('dotenv').config()

const connectdb = async () =>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_KEY);
        console.log(`connected to mongodb database ${conn.connection.host}`)
        console.log("✅ Connected to DB:", mongoose.connection.name);
        console.log("✅ Collections:", Object.keys(mongoose.connection.collections));
    } catch (error) {
        console.log(`error in mongodb ${error}`)
        
    }
}

module.exports = {connectdb}