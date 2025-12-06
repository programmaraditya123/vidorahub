const bcrypt = require('bcrypt')

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

module.exports = {hashPassword,comparePassword}