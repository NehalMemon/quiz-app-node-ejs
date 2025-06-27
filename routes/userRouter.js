const express = require("express");
const router = express.Router();

const formsValidator= require("../middlewares/formsValidator");
const registrationSchema = require("../validators/registerSchema")
const loginSchema = require("../validators/loginSchema")
const authcontroller = require("../controllers/authController")


router.get("/signup" ,authcontroller.signupGet )

router.post("/signup",formsValidator(registrationSchema , { flashAndRedirect: true, redirectTo: "/user/signup" }),authcontroller.signupPost)

router.get("/login" ,authcontroller.loginGet)

router.post("/login",formsValidator(loginSchema , { flashAndRedirect: true, redirectTo: "/user/login" }),authcontroller.loginPost)

router.get("/logout", authcontroller.logout);

module.exports = router;