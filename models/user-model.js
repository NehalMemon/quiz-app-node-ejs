const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_name:{
        type : String,
        required : true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password:{
        type: String,
        required: true,
    },

    email_verified:{
        type:Boolean,
        default:false
    },

    email_otp:{
        type:String,
    },
    email_otp_expiry:{
        type: Date,
    },

    plan:{
        type:String,
        enum:["gold" , "diamond" , null],
        default: null,
    },
    plan_start:{
        type: Date
    },
    plan_expire:{
        type: Date
    },
    is_verfied:{
        type:Boolean,
        default:false
    },
    payment_proof:{
        type:String,
    },
    created_at:{
        type: Date,
        default: Date.now
    },

})


module.exports = mongoose.model("user", UserSchema);