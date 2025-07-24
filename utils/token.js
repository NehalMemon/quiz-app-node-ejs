const jwt = require("jsonwebtoken")

const UsertokenGenerator = (user) => {
    return jwt.sign({
        email:user.email , id: user._id
    },
    process.env.JWT_KEY,
    {expiresIn:"24h"}
)}

const AdmintokenGenerator = (admin) => {
    return jwt.sign({
        email:admin.email , id: admin._id
    },
    process.env.JWT_KEY,
    {expiresIn:"24h"}
)}

module.exports = {UsertokenGenerator , AdmintokenGenerator}