const express = require("express");
const router = express.Router();

const validate= require("../middlewares/formsValidator");
const {registerSchema, otpSchema} = require("../validators/registerSchema")
const loginSchema = require("../validators/loginSchema")
const authcontroller = require("../controllers/authController")
const isloggedin = require("../middlewares/isloggedin");  

const Validator = (req, res, next) => {
  const schema = req.body.otp ? otpSchema : registerSchema;
  return validate(schema, {
    flashAndRedirect: true,
    redirectTo: "/user/signup"
  })(req, res, next);
};

router.get("/signup" ,authcontroller.signupGet )

router.post("/signup",Validator,authcontroller.signupPost)

router.get("/login" ,authcontroller.loginGet)

router.post("/login",validate(loginSchema , { flashAndRedirect: true, redirectTo: "/user/login" }),authcontroller.loginPost)

router.get("/logout", isloggedin.isloggedin, authcontroller.logout);

module.exports = router;