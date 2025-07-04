const mongoose = require("mongoose")
const { type } = require("../validators/loginSchema")
const { required, boolean } = require("joi")

const questionSchema = mongoose.Schema({
    questionText : {
        type:String,
        required:true
    },
    options :[{type:String , required : true}],
    correctAns : {
        type:String,
        required:true,
    }
})


const quizSchema = mongoose.Schema({
    title : {
        type : string,
        required : true,
    },

    description : {
        type : string ,
    },

    question :[questionSchema],

    subject : {
        type:String,
        required:true,
    },

    topic : {
        type:String,
        required:true,
    },

    isActive :{
        type : Boolean,
        default : true
    },

    createdIt : {
        type:Date,
        default : Date.now()
    }

})



module.exports = mongoose.model("Quiz", quizSchema);