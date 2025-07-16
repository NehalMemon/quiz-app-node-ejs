const mongoose = require('mongoose');



const reportSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    quizTitle: String,
    totalQuestions: Number,
    correctAnswers: Number,
    attemptedAnswers: Number,
    date: { type: Date, default: Date.now },
  });


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

    isAdmin:{
        type: Boolean,
        default: false
    },

    reports: [reportSchema],

    lastLogin: {
        type: Date,
        default: null,
      },

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    resetOtp: String,
    resetOtpExpiresAt: Date,
    
    
})


module.exports = mongoose.model("user", UserSchema);