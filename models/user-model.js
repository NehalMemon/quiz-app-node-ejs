const mongoose = require('mongoose');
const { type } = require('../validators/loginSchema');

const UserSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },

    email_verified: {
        type: Boolean,
        default: false
    },

    otp: {
        type: String,
    },
    otp_expiry: {
        type: Date,
    },
    resendOtp: {
        type: Boolean,
        default: false
    },

    isloggedin: {
        type: Boolean,
        default: false
    },
    loginopt:{
        type: String,
        required: true,
    },

    loginOtpExpiresAt: Date,

    loginOtpSentAt: Date,
    

    plan: {
        type: String,
        enum: ["gold", "diamond", null],
        default: null,
    },
    plan_start: {
        type: Date
    },
    plan_expire: {
        type: Date
    },
    is_verfied: {
        type: Boolean,
        default: false
    },
    payment_proof: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now
    },

})


module.exports = mongoose.model("user", UserSchema);