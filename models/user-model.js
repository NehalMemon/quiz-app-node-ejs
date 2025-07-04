const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    userName: {
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

    emailVerified: {
        type: Boolean,
        default: false
    },

    signupOtp: {
        type: String,
    },

    signupOtpExpiry: {
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

    loginOtp: String,

    loginOtpExpiresAt: Date,

    loginOtpSentAt: Date,

    isLoggedIn: Boolean,

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

    isAdmin:{
        type: Boolean,
        default: false
    }

})


module.exports = mongoose.model("user", UserSchema);