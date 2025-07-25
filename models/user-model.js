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
    
    phoneNumber : {
        type : String,
        required : true
    },

    yearOfStudy : {
        type : Number,
        required : true,
        match: /^03[0-9]{9}$/

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

    reports: [  {
        quizId: mongoose.Schema.Types.ObjectId,
        quizTitle: String,
        totalQuestions: Number,
        correctAnswers: Number,
        attemptedAnswers: Number,
        date: Date,
        detailedResults: [Object] // <-- add this
      }],

    

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
    


    isSubscribed: {
        type: Boolean,
        default: false
      },
      subscriptionStart: {
        type: Date
      },
      subscriptionEnd: {
        type: Date
      },
      paymentReference: {
        type: String // store PayPro invoice ref or transaction ID
      }
      
    
})


module.exports = mongoose.model("user", UserSchema);