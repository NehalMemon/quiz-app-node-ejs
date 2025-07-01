const express = require("express");
const router =  express.Router();

const LoginSchema = require("../validators/loginSchema")
const validate = require("../middlewares/formsValidator")
const {registerSchema, otpSchema} = require("../validators/registerSchema")
const adminModel = require("../models/admin-model")
const bcrypt = require("bcrypt")
const tokenGenerator = require("../utils/token")
const isloggedin = require("../middlewares/isloggedin")
const {adminController} = require("../controllers/authController")


router.post("/signup",validate(registerSchema),adminController.signupPost)


router.get("/signup",adminController.signupGet )

router.post("/login",validate(LoginSchema),(req,res)=>{

})


router.get("/login",(req,res)=>{
    res.render("adminLogin",{
        error:null,
        success:null
    })
})

router.get("/",isloggedin,(req,res)=>{
    res.render("dashboard")
})
module.exports = router;