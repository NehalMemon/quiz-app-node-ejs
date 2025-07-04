const express = require("express");
const router = express.Router();

// Middleware and Validators
const validate = require("../middlewares/formsValidator");
const loginSchema = require("../validators/loginSchema");
const { registerSchema } = require("../validators/registerSchema");
const isAdmin = require("../middlewares/isAdmin");
const { isAdminloggedin } = require("../middlewares/isloggedin");

// Controller
const { adminController } = require("../controllers/authController");

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
router.get("/dashboard", isAdminloggedin, (req, res) => {
  res.render("dashboard");
});

router.get("/create-quiz",isAdminloggedin,(req,res)=>{
   res.render("createquiz", {
  error: req.flash("error")[0] || null,
  success: req.flash("success")[0] || null
});

})


module.exports = router;
