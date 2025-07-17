const mongoose = require("mongoose")


// const questionSchema = mongoose.Schema({
//     questionText : {
//         type:String,
//         required:true
//     },
//     options :[{type:String , required : true}],
//     correctAns : {
//         type:String,
//         required:true,
//     }
// })


const quizSchema = mongoose.Schema({
    title : {
        type : String,
        required : true,
    },

    description : {
        type : String ,
    },

    questions: [
        {
          questionText: String,
          options: [String],
          correctAns: String,
        }],

    subject : {
        type:String,
        required:true,
    },

  

    year : {
        type : Number
    },

    category: {
        type: [String],
        enum: ['Midterm', 'Preprof', 'Prof'],
        required: true
      },
      

    isActive :{
        type : Boolean,
        default : true
    },

    createdAt : {
        type:Date,
        default : Date.now()
    }

})



module.exports = mongoose.model("Quiz", quizSchema);