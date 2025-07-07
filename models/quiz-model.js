const mongoose = require("mongoose")


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
        type : String,
        required : true,
    },

    description : {
        type : String ,
    },

    questions:[questionSchema],

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