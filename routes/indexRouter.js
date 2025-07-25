const express = require("express");
const router = express.Router();

// Middleware and Validators
const  {isUserOrAdmin ,isUserloggedin } = require("../middlewares/isloggedin");
const  isActive = require("../middlewares/isActive");
const  isSubscribed = require("../middlewares/issubscribe");



// Controller
const { quizController} = require("../controllers/quizController");





router.get("/", (req, res) => {
    res.render("home", {
      user : req.session.user,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
    });
  });
  

router.get("/quiz-section", isUserOrAdmin,quizController.viewQuizSectionGet);

router.get("/features",(req,res)=>{
  res.render("features",{
    success:null,
    error:null,
  })
});
router.get("/pricing",(req,res)=>{
  res.render("pricing",{
    success:null,
    error:null,
  })
});
router.get("/terms",(req,res)=>{
  res.render("terms",{
    success:null,
    error:null,
  })
});
router.get("/PrivacyPolicy",(req,res)=>{
  res.render("privacy",{
    success:null,
    error:null,
  })
});

router.get("/contact",(req,res)=>{
  res.render("HelpandCOntact",{
    success:null,
    error:null,
    EMAIL_USER:process.env.EMAIL_USER
  })
});
router.get("/faq",(req,res)=>{
  res.render("faq",{
    success:null,
    error:null,
  })
});


router.get("/quiz/:id", isUserOrAdmin, isActive, quizController.viewQuizGet);

router.post("/quiz/:id/submit", isUserOrAdmin, isActive, quizController.submitQuizPost);

router.post("/generate-report", isUserloggedin, isActive, quizController.generateReportPost);

module.exports = router;