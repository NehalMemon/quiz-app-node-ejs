const express = require("express");
const router = express.Router();

// Middleware and Validators
const validate = require("../middlewares/formsValidator");
const loginSchema = require("../validators/loginSchema");
const { registerSchema } = require("../validators/registerSchema");
const isAdmin = require("../middlewares/isAdmin");
const { isAdminloggedin , isUserOrAdmin } = require("../middlewares/isloggedin");

// Controller
const { adminController } = require("../controllers/authController");
const { quizController } = require("../controllers/quizController");
const { userController } = require("../controllers/userContoller");

// Admin Signup Routes
router.get("/signup", adminController.signupGet);
router.post(
  "/signup",
  validate(registerSchema, {
    flashAndRedirect: true,
    redirectTo: "/admin/signup",
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
  }),
  adminController.loginPost
);

// Admin Logout
router.get("/logout", adminController.logout);

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

router.post("/delete-user/:id",isAdminloggedin, userController.deleteUsersPost );

router.post("/activation-user/:id",isAdminloggedin, userController.activationUsersPost );



module.exports = router;
