const bcrypt = require('bcrypt')
const { OAuth2Client } = require("google-auth-library");


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const hashPassword = async(password) => {
    try {
        const hashedPassword = await bcrypt.hash(password,10)
        return hashedPassword
    } catch (error) {
        console.log("While hashing password",error)
        
    }
}

const comparePassword = async(password,hashPassword) => {
    return bcrypt.compare(password,hashPassword)
}




const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

module.exports = {hashPassword,comparePassword,verifyGoogleToken}