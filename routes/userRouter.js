const express = require("express");
const router = express.Router();

// Middlewares and Validators
const  {isUserOrAdmin ,isUserloggedin } = require("../middlewares/isloggedin");
const validate = require("../middlewares/formsValidator");
const { registerSchema, otpSchema } = require("../validators/registerSchema");
const loginSchema = require("../validators/loginSchema");
const { authController } = require("../controllers/authController");
const { userController } = require("../controllers/userContoller");

// Middleware to choose schema dynamically
const SignupValidator = (req, res, next) => {
  if (req.body.resendOtp) return next(); // skip Joi check on resend
  const schema = req.body.signupOtp ? otpSchema : registerSchema;
  return validate(schema, {
    flashAndRedirect: true,
    redirectTo: "/user/signup",
  })(req, res, next);
};

const LoginValidator = (req, res, next) => {
  if (req.body.resendOtp) return next();
  const schema = req.body.signupOtp ? otpSchema : loginSchema;
  return validate(schema, {
    flashAndRedirect: true,
    redirectTo: "/user/login",
  })(req, res, next);
};

// Signup Routes
router.get("/signup", authController.signupGet);
router.post("/signup", SignupValidator, authController.signupPost);

// Login Routes
router.get("/login", authController.loginGet);
router.post("/login", LoginValidator, authController.loginPost);

// Logout
router.get("/logout", authController.logout);

router.get("/profile/", isUserloggedin, userController.reportsGet);

router.get("/forgot-password", authController.forgotPasswordGet);
router.post("/forgot-password", authController.forgotPasswordPost);

router.get("/reset-password/", authController.resetPasswordGet);
router.post("/reset-password/", authController.resetPasswordPost);


module.exports = router;
