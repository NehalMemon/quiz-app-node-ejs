// controllers/quizController.js
const quizController = {};
const Quiz = require("../models/quiz-model");
const User = require("../models/user-model");
const Year = require("../models/year-model");
const Module = require("../models/module-model");
const mongoose = require("mongoose");


quizController.createQuizGet = async (req, res) => {
  try {
    const years = await Year.find().sort({name : 1});   // levels (e.g., 1st year, 2nd year)
    const modules = await Module.find();

    res.render("Create-Quiz", {
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
      old: req.flash("old")[0] || null,
      levels: years,     // Pass to EJS
      modules            // Pass to EJS
    });
  } catch (err) {
    console.error("Error loading quiz form:", err);
    req.flash("error", "Could not load quiz form.");
    res.redirect("/admin/dashboard");
  }
};

// POST: Create Quiz
quizController.createQuizPost = async (req, res) => {
  const { title, subject, year, level, module } = req.body;
  let category = req.body.category;

  if (!Array.isArray(category)) {
    category = category ? [category] : [];
  }

  let questions;
  try {
    questions = JSON.parse(req.body.questions);
  } catch (err) {
    req.flash("error", "Invalid question format.");
    req.flash("old", { title, subject, year, level, module, category });
    return res.redirect("/admin/create-quiz");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    req.flash("error", "Please provide at least one question.");
    req.flash("old", { title, subject, year, level, module, category });
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
      req.flash("old", { title, subject, year, level, module, category });
      return res.redirect("/admin/create-quiz");
    }

    // Convert correctIndex to correctAns
    q.correctAns = q.options[q.correctIndex];
    delete q.correctIndex;
  }
    const Level =await Year.findOne({name:level})
  try {
    const newQuiz = new Quiz({
      title,
      subject,
      year: parseInt(year), // Appeared year
      level :Level._id,                // ObjectId from Year model
      module,               // ObjectId from Module model
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





  
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key] ? item[key].toString() : 'Unknown';
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {});
}

quizController.viewQuizSectionGet = async (req, res) => {
  try {
    const { subject = '', topic = '', category, module: selectedModule, year: selectedYear } = req.query;
    const filters = {};

    const userYear = Number(req.user?.yearOfStudy);
    const isAdmin = req.admin?.isAdmin || false;

    // Subject/topic filtering
    if (subject.trim()) filters.subject = { $regex: subject.trim(), $options: "i" };
    if (topic.trim()) filters.topic = { $regex: topic.trim(), $options: "i" };

    // Category filtering
    let selectedCategories = category;
    if (selectedCategories && !Array.isArray(selectedCategories)) {
      selectedCategories = [selectedCategories];
    }
    if (selectedCategories?.length > 0) {
      filters.category = { $in: selectedCategories };
    }

    // Module filter
    if (selectedModule && selectedModule !== "all") {
      filters.module = selectedModule;
    }

    // Year filter for admin (to filter modules or quizzes by year)
    if (isAdmin && selectedYear && selectedYear !== "all") {
      filters["level.name"] = selectedYear;
    }

    // Fetch quizzes
    const allQuizzes = await Quiz.find(filters)
      .sort({ year: -1, createdAt: -1 })
      .populate("level module")
      .lean();

    const visibleQuizzes = isAdmin ? allQuizzes : allQuizzes.filter(q => q.isActive);

    // If not admin, restrict quizzes to user's year
    const eligibleQuizzes = isAdmin
      ? visibleQuizzes
      : visibleQuizzes.filter(q => q.level && Number(q.level.name) === userYear);

    eligibleQuizzes.forEach(quiz => {
      quiz.year = quiz.year ? quiz.year.toString() : "Unknown";
    });

    const quizzesByYear = groupBy(eligibleQuizzes, "year");

    const sortedYears = Object.keys(quizzesByYear).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return parseInt(b) - parseInt(a);
    });

    const sortedQuizzesByYear = {};
    sortedYears.forEach(year => {
      sortedQuizzesByYear[year] = quizzesByYear[year];
    });

    // Get modules
    let modulesForYear = [];

    if (isAdmin) {
      // All modules with their levels populated (for grouping by year)
      const allModules = await Module.find().populate("level").lean();
      const groupedModules = groupBy(allModules, m => m.level?.name || "Unknown");
      modulesForYear = groupedModules;
    } else {
      // Only modules for the user's year
      const year = await Year.findOne({name : req.user.yearOfStudy })
      modulesForYear = await Module.find({ level: year._id }).lean();
    }
    const levels = await Year.find().sort({name : 1}); 

    res.render("Quiz-section", {
      quizzesByYear: sortedQuizzesByYear,
      modulesForYear,
      selectedModule,
      selectedYear,
      admin: isAdmin,
      subject,
      topic,
      selectedCategories,
      levels,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
      old: req.flash("old")[0] || null,
    });

  } catch (err) {
    console.error("Error fetching quizzes:", err);
    req.flash("error", "Failed to load quizzes");
    res.redirect("/");
  }
};



quizController.viewQuizGet = async (req,res) => {
 try { const quiz = await Quiz.findById(req.params.id).populate("module").populate("level");

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

    res.render("quiz-result", {
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
    const quiz = await Quiz.findById(req.params.id).populate("level")
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/dashboard");
    }

    const years = await Year.find().sort({name : 1});   // levels (e.g., 1st year, 2nd year)
    const modules = await Module.find();
    res.render("Edit-quiz", {
      quiz,
      levels : years,
      modules,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
      old: req.flash("old")[0] || null
    });
  } catch (err) {
    console.error("Edit Quiz Error:", err);
    req.flash("error", "Something went wrong");
    res.redirect("/admin/dashboard");
  }
};





quizController.editQuizPost = async (req, res) => {
  try {
    const {
      title,
      subject,
      questions,
      year,
      module,
      level,
      category
    } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/dashboard");
    }

    // Parse and validate questions JSON
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (err) {
      req.flash("error", "Invalid question format.");
      req.flash("old", req.body);
      return res.redirect(`/admin/quiz/${req.params.id}/edit`);
    }

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

      q.correctAns = q.options[q.correctIndex];
    }

    // Update all quiz fields
    quiz.title = title || quiz.title;
    quiz.subject = subject || quiz.subject;
    quiz.questions = parsedQuestions;

    if (year) quiz.year = parseInt(year);
    if (module) quiz.module = module;

    // ✅ Handle level (assumes it's a string or ObjectId ref)
    const Level =await Year.findOne({name:level})
    if (Level) {
    quiz.level = Level._id
    }
    // ✅ Handle categories (array or single value)
    if (category) {
      if (Array.isArray(category)) {
        quiz.category = category;
      } else {
        quiz.category = [category];
      }
    }

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
      return res.redirect("/quiz-section");
  }

  await quiz.deleteOne();
  req.flash("success", "Quiz deleted successfully");
  res.redirect("/quiz-section");
}
  catch(err){
    console.error("Unable to delete quiz", err);
    req.flash("error", "Something went wrong");
    res.redirect("/quiz-section");
  }
}

quizController.activationQuizPost = async (req,res) => {
  try{
    const quiz = await Quiz.findById(req.params.id);

    if(!quiz){
      req.flash("error", "Quiz not found");
      return res.redirect("/quiz-section");
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
