// controllers/quizController.js
const quizController = {};
const Quiz = require("../models/quiz-model");
const User = require("../models/user-model");

quizController.createQuizGet = (req, res) => {
  res.render("Create-Quiz", {
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    old: req.flash("old")[0] || null
  });
};

quizController.createQuizPost = async (req, res) => {
  try {
    const { title, subject, topic } = req.body;
    let questions = req.body.questions;

    if (!questions || typeof questions !== 'object') {
      req.flash("error", "Please provide at least one question.");
      req.flash("old", { title, subject, topic, questions });
      return res.redirect("/admin/create-quiz");
    }

    if (!Array.isArray(questions)) {
      questions = Object.keys(questions)
        .sort()
        .map((key) => questions[key]);
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      q.correctAns = q.correctAns.trim();
      q.options = q.options.map(opt => opt.trim());

      if (!q.options.includes(q.correctAns)) {
        req.flash("error", `Correct answer for Question ${i + 1} must be one of the options.`);
        req.flash("old", { title, subject, topic, questions });
        return res.redirect("/admin/create-quiz");
      }
    }

    const newQuiz = new Quiz({
      title,
      subject,
      topic,
      questions
    });

    await newQuiz.save();
    req.flash("success", "Quiz created successfully.");
    return res.redirect("/admin/create-quiz");
  } catch (err) {
    console.error("Quiz Creation Error:", err);
    req.flash("error", "Failed to create quiz.");
    req.flash("old", req.body);
    return res.redirect("/admin/create-quiz");
  }
};


quizController.viewQuizSectionGet = async (req, res) => {
  try {
    const { subject, topic } = req.query;
    const filters = {};

    if (subject) filters.subject = { $regex: subject, $options: "i" };
    if (topic) filters.topic = { $regex: topic, $options: "i" };

    const allQuizzes = await Quiz.find(filters).sort({ createdAt: -1 });
    const isAdmin = req.admin?.isAdmin || false;


    const visibleQuizzes = isAdmin
      ? allQuizzes
      : allQuizzes.filter(q => q.isActive);

    res.render("Quiz-section", {
      quiz: visibleQuizzes,
      admin: isAdmin,
      subject: subject || '',
      topic: topic || '',
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
    });
  } catch (err) {
    console.error("Error fetching quizzes:", err);
    req.flash("error", "Failed to load quizzes");
    res.redirect("/");
  }
};



quizController.viewQuizGet = async (req,res) => {
 try { const quiz = await Quiz.findById(req.params.id);

  if(!quiz){
    req.flash("error","Quiz not found");
    return res.redirect("/quiz-section")
  }

  res.render("quiz" , {
    quiz,
    admin : req.admin || null ,
    success : req.flash("success")[0] || null,
    error : req.flash("error")[0] || null 
  })

}
  catch(err){
    console.error("Error loading quiz detail:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/quiz-section");
}
}



quizController.generateReportPost = async (req, res) => {
  const userId = req.user._id;
  const quizId = req.body.quizId;

  try {
    const quiz = await Quiz.findById(quizId);
    const user = await User.findById(userId);

    if (!quiz || !user) {
      req.flash("error", "Quiz or user not found.");
      return res.redirect("/quiz-section");
    }

    // Calculate correct answers from session (or temp storage)
    const results = req.session.lastResults; // ← You must have stored this earlier
    if (!results) {
      req.flash("error", "No result data found.");
      return res.redirect("/quiz-section");
    }

    const correctAnswers = results.filter(r => r.isCorrect).length;

    const report = {
      quizId: quiz._id,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      attemptedAnswers: results.length,
    };

    user.reports.push(report);
    await user.save();

    req.flash("success", "Report saved to your profile.");
    res.redirect("/user/profile");
  } catch (err) {
    console.error("Report saving failed:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/quiz-section");
  }
};


quizController.submitQuizPost = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userAnswers = req.body.answers; // answers[0], answers[1], etc.

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      req.flash("error", "Quiz not found.");
      return res.redirect("/quiz-section");
    }

    const results = quiz.questions.map((q, i) => {
      const userAnswer = userAnswers[i];
      const isCorrect = userAnswer === q.correctAns;
      return {
        questionText: q.questionText,
        options: q.options,
        correctAns: q.correctAns,
        userAnswer,
        isCorrect,
      };
    });


    req.session.lastResults = results;

    res.render("Quiz-result", {
      quiz,
      results,
    });

  } catch (err) {
    console.error("Quiz Submission Error:", err);
    req.flash("error", "Something went wrong while submitting.");
    res.redirect("/quiz-section");
  }
};


quizController.editQuizGet = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/dashboard");
    }

    res.render("Edit-quiz", {
      quiz,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null
    });
  } catch (err) {
    console.error("Edit Quiz Error:", err);
    req.flash("error", "Something went wrong");
    res.redirect("/admin/dashboard");
  }
};


quizController.editQuizPost = async (req, res) => {
  try {
    const { title, subject, topic, description, questions } = req.body;

    // Make sure quiz exists
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/dashboard");
    }

    quiz.title = title;
    quiz.subject = subject;
    quiz.topic = topic;
    quiz.description = description;
    quiz.questions = JSON.parse(questions); // questions come as JSON string

    await quiz.save();

    req.flash("success", "Quiz updated successfully");
    res.redirect(`/quiz/${quiz._id}`);
  } catch (err) {
    console.error("Quiz Update Error:", err);
    req.flash("error", "Failed to update quiz");
    res.redirect(`/admin/quiz/${req.params.id}/edit`);
  }
};

quizController.deleteQuizPost = async (req,res) => {
  try{
    const quiz = await Quiz.findById(req.params.id);

    if(!quiz){
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/quiz-section");
  }

  await quiz.deleteOne();
  req.flash("success", "Quiz deleted successfully");
  res.redirect("/admin/quiz-section");
}
  catch(err){
    console.error("Unable to delete quiz", err);
    req.flash("error", "Something went wrong");
    res.redirect("/admin/quiz-section");
  }
}

quizController.activationQuizPost = async (req,res) => {
  try{
    const quiz = await Quiz.findById(req.params.id);

    if(!quiz){
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/quiz-section");
  }

  
  if(quiz.isActive){
    quiz.isActive = false;
    await quiz.save();
    req.flash("success", "Quiz activated successfully");
    res.redirect(`/quiz/${quiz._id}`);
  }
  else{
    quiz.isActive = true;
    await quiz.save();
    req.flash("success", "Quiz deactivated successfully");
    res.redirect(`/quiz/${quiz._id}`);
  }


}
  catch(err){
    console.error("Unable to delete quiz", err);
    req.flash("error", "Something went wrong");
    res.redirect("/admin/quiz-section");
  }
}

module.exports = { quizController };
