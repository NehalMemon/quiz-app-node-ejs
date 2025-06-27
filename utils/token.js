const jwt = require("jsonwebtoken")

const tokenGenerator = (user) => {
    return jwt.sign({
        email:user.eamil , id: user._id
    },
    process.env.JWT_KEY,
    {expiresIn:"1h"}
)}

module.exports = tokenGenerator