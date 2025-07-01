const mongoose = require('mongoose');


const adminSchema = mongoose.Schema({
    userName : {
        type:String
    },

    email:{
        type:String
    },

    password:{
        type:String
    },

    isAdmin:{
        type:Boolean,
        default:true
    }

})


module.exports = mongoose.model("admin", adminSchema);