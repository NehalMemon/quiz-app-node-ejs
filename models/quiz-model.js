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


    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
        required: true,
      },
    
      // optional: you can also store the year for easier filtering
      level: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Year",
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