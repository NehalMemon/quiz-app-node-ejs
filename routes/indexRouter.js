const express = require("express");
const router = express.Router();

// Middleware and Validators
const  {isUserOrAdmin ,isUserloggedin } = require("../middlewares/isloggedin");
const  isActive = require("../middlewares/isActive");
const  isSubscribed = require("../middlewares/issubscribe");



// Controller
const { quizController} = require("../controllers/quizController");





router.get("/", (req, res) => {
    res.render("Home", {
      user : req.session.user,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
    });
  });
  

router.get("/quiz-section", isUserOrAdmin,quizController.viewQuizSectionGet);


router.get("/quiz/:id", isUserOrAdmin, isActive, quizController.viewQuizGet);

router.post("/quiz/:id/submit", isUserOrAdmin, isActive, quizController.submitQuizPost);

router.post("/generate-report", isUserloggedin, isActive, quizController.generateReportPost);

module.exports = router;