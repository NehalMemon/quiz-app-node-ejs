const usermodel = require("../models/user-model")
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken")
const tokenGenerator = require("../utils/token")

const authController = {};
authController.signupPost = async (req, res) => {
  try {
    const { userName, email, password, signupOtp, resendOtp } = req.body;


    if (resendOtp) {
      const sessionData = req.session.tempUser;

      if (!sessionData) {
        req.flash("error", "Session expired.");
        return res.redirect("/user/signup");
      }

      // Generate a new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionData.signupOtp = newOtp;
      sessionData.signupOtpExpiry = Date.now() + 5 * 60 * 1000;

      // Send new OTP email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: sessionData.email,
        subject: "Your New OTP Code",
        text: `Your new OTP is: ${newOtp}`
      });

      req.flash("success", "New OTP sent to your email.");
      return res.redirect("/user/signup");
    }


    // 1️⃣ Handle common email typos
    if (typeof email === "string" && email.includes("@")) {
      const [localPart, domain] = email.split("@");
      const emailTypos = {
        "gamil.com": "gmail.com",
        "gnail.com": "gmail.com",
        "hotnail.com": "hotmail.com",
        "yaho.com": "yahoo.com"
      };

      if (emailTypos[domain]) {
        req.flash("error", `Did you mean ${localPart}@${emailTypos[domain]}?`);
        return res.redirect("/user/signup");
      }
    }

    // 2️⃣ Handle OTP submission
    if (signupOtp) {
      const sessionData = req.session.tempUser;

      if (
        !sessionData ||
        sessionData.signupOtp !== signupOtp ||
        Date.now() > sessionData.signupOtpExpiry
      ) {
        req.flash("error", "Invalid or expired OTP.");
        return res.render("signup", {
          error: req.flash("error"),
          success: null,
          showOtp: true,
          old: { userName: sessionData?.userName || "", email: sessionData?.email || "" }
        });
      }

      // Hash password from session and create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(sessionData.password, salt);

      const newUser = await usermodel.create({
        userName: sessionData.userName,
        email: sessionData.email,
        password: hashedPassword
      });

      // Clear session and set login token
      req.session.tempUser = null;
      const token = tokenGenerator(newUser);
      res.cookie("token", token, { httpOnly: true });

      req.flash("success", "User created successfully");
      return res.redirect("/home");
    }

    // 3️⃣ First-time submission (no OTP yet)
    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email already registered.");
      return res.redirect("/user/signup");
    }

    // Generate OTP and store data temporarily in session
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.tempUser = {
      userName,
      email,
      password,
      signupOtp: generatedOtp,
      signupOtpExpiry: Date.now() + 5 * 60 * 1000
    };

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${generatedOtp}`
    });

    req.flash("success", "OTP sent to your email.");
    return res.render("signup", {
      success: req.flash("success"),
      error: null,
      showOtp: true,
      old: { userName, email }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    req.flash("error", "Server error occurred.");
    return res.redirect("/user/signup");
  }
};

authController.signupGet = (req, res) => {
  let error = req.flash("error")
  let success = req.flash("success")
  const old = req.flash("old")[0] || {};
  res.render("signup", {
    error: error.length > 0 ? error : null,
    success: success.length > 0 ? success[0] : null,
    showOtp: false,
    old
  })
}


authController.loginGet = (req, res) => {
  let error = req.flash("error")
  let success = req.flash("success")
  res.render("login", {
    error: error.length > 0 ? error[0] : null,
    success: success.length > 0 ? success[0] : null,
    showOtp: false,
  })
}

authController.loginPost = async (req, res) => {
  try {
    let { email, password, signupOtp } = req.body;

    // 1. Validate email presence
    if (!email) {
      req.flash("error", "Email is required.");
      return res.redirect("/user/login");
    }

    // 2. Email typo check
    const domain = email.split("@")[1];
    const commonEmailTypos = {
      "gamil.com": "gmail.com",
      "gnail.com": "gmail.com",
      "hotnail.com": "hotmail.com",
      "yaho.com": "yahoo.com"
    };

    if (commonEmailTypos[domain]) {
      const suggestion = `${email.split("@")[0]}@${commonEmailTypos[domain]}`;
      req.flash("error", `Did you mean ${suggestion}?`);
      return res.redirect("/user/login");
    }

    // 3. Check if user exists
    let user = await usermodel.findOne({ email });
    if (!user) {
      req.flash("error", "No user found with this email.");
      return res.redirect("/user/login");
    }

    // 4. Handle OTP Verification Phase
    if (signupOtp) {
      signupOtp = signupOtp.toString(); // Ensure OTP is string for comparison
      
      // Check if OTP is valid
      if (!user.loginOtp || !user.loginOtpExpiresAt) {
        req.flash("error", "No OTP requested for this account.");
        return res.render("login", {
          error: "No OTP requested for this account.",
          success: null,
          showOtp: true,
          email
        });
      }

      if (user.loginOtp !== signupOtp) {
        req.flash("error", "Invalid OTP code.");
        return res.render("login", {
          error: "Invalid OTP code.",
          success: null,
          showOtp: true,
          email
        });
      }

      if (Date.now() > user.loginOtpExpiresAt) {
        req.flash("error", "OTP has expired. Please request a new one.");
        return res.render("login", {
          error: "OTP has expired. Please request a new one.",
          success: null,
          showOtp: true,
          email
        });
      }
      
      // OTP is valid → Login user
      user.isLoggedIn = true;
      user.loginOtp = null;
      user.loginOtpExpiresAt = null;
      user.loginOtpSentAt = null;
      await user.save();
      
      const token = tokenGenerator(user);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      req.flash("success", "Logged in successfully.");
      return res.redirect("/home");
    }

    // 5. Check if already logged in elsewhere
    if (user.isLoggedIn) {
      req.flash("error", "This account is already in use on another device.");
      return res.redirect("/user/login");
    }
    
    // 6. Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      req.flash("error", "Incorrect password.");
      return res.redirect("/user/login");
    }

    // 7. Check OTP resend restriction (24 hours)
    if (user.loginOtpSentAt && Date.now() - user.loginOtpSentAt < 24 * 60 * 60 * 1000) {
      const timeLeft = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - user.loginOtpSentAt)) / (60 * 60 * 1000));
      req.flash("error", `Please wait ${timeLeft.toFixed(1)} hours before requesting a new OTP.`);
      return res.render("login", {
        error: `Please wait ${timeLeft.toFixed(1)} hours before requesting a new OTP.`,
        success: null,
        showOtp: true,
        email
      });
    }

    // 8. Generate & Send OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = generatedOtp;
    user.loginOtpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    user.loginOtpSentAt = Date.now();
    await user.save();

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email with OTP
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your One-Time Password (OTP)</h2>
          <p style="font-size: 16px;">Use the following OTP to complete your login:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; color: #2c3e50; letter-spacing: 3px;">${generatedOtp}</h1>
          </div>
          <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes.</p>
          <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    req.flash("success", "OTP sent to your email. Check your inbox!");
    return res.render("login", {
      error: null,
      success: "OTP sent to your email. Check your inbox!",
      showOtp: true,
      email
    });

  } catch (err) {
    console.error("Login Error:", err);
    req.flash("error", "An unexpected error occurred. Please try again.");
    return res.redirect("/user/login");
  }
}


authController.logout = async (req, res) => {
  try {
    
    let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
    await usermodel.findOneAndUpdate({ email: decoded.email }, { isloggedin: false })
    res.clearCookie("token")
    res.status(200).redirect("/user/login")
  }
  catch (err) {
    req.flash("error", err.message)
    res.redirect("/user/login")
  }
}

const adminController ={}

adminController.signupPost =  async (req,res)=>{
    let {userName , email , password} = req.body

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password , salt)

    let admin = await adminModel.create({
        userName,
        email,
        password:hash
    })
    
      const token = tokenGenerator(admin);
      res.cookie("token", token, { httpOnly: true,maxAge:"1hr" });

      req.flash("success", "User created successfully");
      return res.redirect("/admin");

}



adminController.signupGet = (req,res)=>{
    res.render("adminsignup",{
        error:null,
        success:null
    })
}

module.exports = {authController , adminController} 