const express = require("express");
const router = express.Router();

// Middleware and Validators

const  {isUserOrAdmin ,isUserloggedin } = require("../middlewares/isloggedin");

// Controller

const { quizController} = require("../controllers/quizController");


router.get("/home", (req,res)=>{
      let error = req.flash("error")
  let success = req.flash("success")
    res.render("home",
        {
            error: error > 0 ? error[0] : null,
            success: success > 0 ? success[0] : null,
        }
    )
})

router.get("/quiz-section",isUserOrAdmin,quizController.viewQuizSectionGet);


router.get("/quiz/:id",isUserOrAdmin,quizController.viewQuizGet);

router.post("/quiz/:id/submit",isUserOrAdmin,quizController.submitQuizPost);

router.post("/generate-report", isUserloggedin, quizController.generateReportPost);

module.exports = router;