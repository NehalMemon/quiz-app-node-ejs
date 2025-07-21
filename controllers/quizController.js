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
  const { title, subject, year } = req.body;
  let category = req.body.category;

  // Ensure category is always an array
  if (!Array.isArray(category)) {
    category = category ? [category] : [];
  }

  let questions;

  try {
    questions = JSON.parse(req.body.questions);
  } catch (err) {
    req.flash("error", "Invalid question format.");
    req.flash("old", { title, subject, year, category });
    return res.redirect("/admin/create-quiz");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    req.flash("error", "Please provide at least one question.");
    req.flash("old", { title, subject, year, category });
    return res.redirect("/admin/create-quiz");
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (
      !q.questionText ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex > 3
    ) {
      req.flash("error", `Invalid data in Question ${i + 1}.`);
      req.flash("old", { title, subject, year, category });
      return res.redirect("/admin/create-quiz");
    }

    // Convert correctIndex to correctAns
    q.correctAns = q.options[q.correctIndex];
    delete q.correctIndex; // Remove unnecessary field
  }

  try {
    const newQuiz = new Quiz({
      title,
      subject,
      year: parseInt(year),
      category,
      questions,
    });

    await newQuiz.save();

    req.flash("success", "Quiz created successfully.");
    return res.redirect("/quiz-section");

  } catch (err) {
    console.error("Error creating quiz:", err);
    req.flash("error", "Something went wrong while saving quiz.");
    return res.redirect("/admin/create-quiz");
  }
};


  
quizController.viewQuizSectionGet = async (req, res) => {
  try {
    const { subject = '' } = req.query;

    const filters = {};
    if (subject.trim()) {
      filters.subject = { $regex: subject.trim(), $options: 'i' };
    }

    // Handle category filters
    let selectedCategories = req.query.category;
    if (selectedCategories && !Array.isArray(selectedCategories)) {
      selectedCategories = [selectedCategories];
    }

    if (selectedCategories && selectedCategories.length > 0) {
      filters.category = { $in: selectedCategories };
    }

    // Apply both filters
    const quizzes = await Quiz.find(filters).sort({ year: -1 });

    const isAdmin = req.admin?.isAdmin || false;
    const visibleQuizzes = isAdmin
      ? quizzes
      : quizzes.filter(q => q.isActive);

    const groupedQuizzes = {};
    for (const quiz of visibleQuizzes) {
      const year = quiz.year || 'Unknown';
      if (!groupedQuizzes[year]) groupedQuizzes[year] = [];
      groupedQuizzes[year].push(quiz);
    }

    res.render('Quiz-section', {
      quizzes,
      groupedQuizzes,
      subject: req.query.subject || '',
      selectedCategories: selectedCategories || [],
      admin: isAdmin,
      error: req.flash('error')[0] || null,
      success: req.flash('success')[0] || null,
    });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    req.flash('error', 'Failed to load quizzes');
    res.redirect('/');
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
      date: new Date(), // make sure to store date
      detailedResults: results 
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
      success : req.flash("success")[0] || null,
      error : req.flash("error")[0] || null,
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

    // Parse questions
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (err) {
      req.flash("error", "Invalid question format.");
      req.flash("old", req.body);
      return res.redirect(`/admin/quiz/${req.params.id}/edit`);
    }

    // Validate and enrich each question
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];

      if (
        !q.questionText ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 || q.correctIndex > 3
      ) {
        req.flash("error", `Invalid data in Question ${i + 1}.`);
        req.flash("old", req.body);
        return res.redirect(`/admin/quiz/${req.params.id}/edit`);
      }

      // ✅ Set correctAns for mongoose schema validation
      q.correctAns = q.options[q.correctIndex];
    }

    // Update quiz fields
    quiz.title = title;
    quiz.subject = subject;
    quiz.topic = topic;
    quiz.description = description;
    quiz.questions = parsedQuestions;

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
