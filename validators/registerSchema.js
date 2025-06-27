const joi = require("joi");

const registerSchema = joi.object({
    user_name : joi.string().min(3).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required()
})


module.exports= registerSchema