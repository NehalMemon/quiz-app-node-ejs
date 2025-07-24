const joi = require("joi");

const registerSchema = joi.object({
    userName : joi.string().min(3).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    phoneNumber: joi.string().min(11).required(),
    yearOfStudy: joi.string().required()
})

const otpSchema = joi.object({
  signupOtp: joi.string().length(6).required()
}).unknown(true);


module.exports= { registerSchema, otpSchema }