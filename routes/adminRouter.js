const express = require("express");
const router = express.Router();
const Module = require('../models/module-model');
const Year = require("../models/year-model");



// Middleware and Validators
const validate = require("../middlewares/formsValidator");
const loginSchema = require("../validators/loginSchema");
const { registerSchema } = require("../validators/registerSchema");
const isAdmin = require("../middlewares/isAdmin");
const { isAdminloggedin , isUserOrAdmin } = require("../middlewares/isloggedin");
const devOnly = require("../middlewares/AdminSignupAccess");

// Controller
const { adminController } = require("../controllers/authController");
const { quizController } = require("../controllers/quizController");
const { userController } = require("../controllers/userContoller");

// Admin Signup Routes
router.get("/signup",devOnly, adminController.signupGet);
router.post(
  "/signup",
  validate(registerSchema, {
    flashAndRedirect: true,
    redirectTo: "/admin/signup",
    redirectTo: "Admin-signup",
  }),
  adminController.signupPost
);

// Admin Login Routes
router.get("/login", adminController.loginGet);
router.post(
  "/login",
  validate(loginSchema, {
    flashAndRedirect: true,
    redirectTo: "/admin/login",
    redirectTo: "Admin-login",
  }),
  adminController.loginPost
);

// Admin Logout
router.get("/logout", adminController.logout);

router.post("/logout", adminController.logout);

// Admin Dashboard (Protected Route)
router.get("/dashboard", isAdminloggedin, adminController.dashboardGet);

router.get("/create-quiz",isAdminloggedin,quizController.createQuizGet);

router.post("/create-quiz",isAdminloggedin,quizController.createQuizPost);


router.get("/quiz/:id/edit" , isAdminloggedin ,quizController.editQuizGet );

router.post("/quiz/:id/edit" , isAdminloggedin ,quizController.editQuizPost );


router.post("/quiz/:id/delete" , isAdminloggedin , quizController.deleteQuizPost);

router.post("/quiz/:id/activation" , isAdminloggedin , quizController.activationQuizPost);


router.get("/users",isAdminloggedin, userController.viewUsersGet);

router.get("/user/:id",isAdminloggedin, userController.controlUsersGet );



router.post("/activation-user/:id",isAdminloggedin, userController.activationUsersPost );


// GET: /admin/modules-by-level
router.get("/modules-by-level", async (req, res) => {
  const levelName = Number(req.query.level);
  if (isNaN(levelName)) {
    return res.json({ success: false, message: "Invalid level number" });
  }
  

  try {
    const year = await Year.findOne({ name: levelName }); // find Year with name = 1, 2, etc.
    if (!year) return res.json({ success: false, message: "Year not found" });

    const modules = await Module.find({ level: year._id }); // filter by ObjectId
    res.json({ success: true, modules });



  } catch (err) {
    console.error("Error loading modules by level:", err);
    res.json({ success: false, message: "Server error" });
  }
});



module.exports = router;
