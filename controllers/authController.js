const usermodel = require("../models/user-model")
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');

const tokenGenerator = require("../utils/token")

const authcontroller = {};
authcontroller.signupPost = async (req, res) => {
  try {
    const { user_name, email, password, otp, resendOtp } = req.body;


    if (resendOtp) {
      const sessionData = req.session.tempUser;

      if (!sessionData) {
        req.flash("error", "Session expired.");
        return res.redirect("/user/signup");
      }

      // Generate a new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionData.otp = newOtp;
      sessionData.otp_expiry = Date.now() + 5 * 60 * 1000;

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
    if (otp) {
      const sessionData = req.session.tempUser;

      if (
        !sessionData ||
        sessionData.otp !== otp ||
        Date.now() > sessionData.otp_expiry
      ) {
        req.flash("error", "Invalid or expired OTP.");
        return res.render("signup", {
          error: req.flash("error"),
          success: null,
          showOtp: true,
          old: { user_name: sessionData?.user_name || "", email: sessionData?.email || "" }
        });
      }

      // Hash password from session and create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(sessionData.password, salt);

      const newUser = await usermodel.create({
        user_name: sessionData.user_name,
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
      user_name,
      email,
      password,
      otp: generatedOtp,
      otp_expiry: Date.now() + 5 * 60 * 1000
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
      old: { user_name, email }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    req.flash("error", "Server error occurred.");
    return res.redirect("/user/signup");
  }
};

authcontroller.signupGet = (req, res) => {
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


authcontroller.loginGet = (req, res) => {
  let error = req.flash("error")
  let success = req.flash("success")
  res.render("login", {
    error: error.length > 0 ? error[0] : null,
    success: success.length > 0 ? success[0] : null
  })
}

authcontroller.loginPost = async (req, res) => {
  try {
    let { email, password, otp } = req.body;


    // 1. Email typo check
    const domain = email.split("@")[1];
    const commonEmailTypos = {
      "gamil.com": "gmail.com",
      "gnail.com": "gmail.com",
      "hotnail.com": "hotmail.com",
      "yaho.com": "yahoo.com"
    };

    if (commonEmailTypos[domain]) {
      req.flash("error", `Did you mean ${email.split("@")[0]}@${commonEmailTypos[domain]}?`);
      return res.redirect("/user/login");
    }

      // 2. Check if user exists

    let user = await usermodel.findOne({ email });

    if (!user) {
      req.flash("error", "No user found ")
      return res.redirect("/user/login")

    }

     // 3. Check if user already logged in
    if (user.isLoggedIn) {
      req.flash("error", "This account is already in use on another device.");
      return res.redirect("/user/login");
    }


    // 4. Handle OTP Verification

    if (otp) {
      if (
        !user.loginotp ||
        user.loginotp !== otp ||
        !user.loginOtpExpiresAt ||
        Date.now() > user.loginOtpExpiresAt
      ) {
        req.flash("error", "Invalid or expired OTP.");
        return res.render("login", { error: req.flash("error"), showOtp: true, email });
      }
      let token = tokenGenerator(user);
      res.cookie("token", token, {
        httpOnly: true
      })
      
      // OTP is valid → proceed to login
      user.isloggedIn = true;
      user.loginotp = null;
      user.loginOtpExpiresAt = null;
      await user.save()

      req.flash("success", "Logged in successfully.");
      return res.redirect("/home");
    }


      // 5. Validate password

    bcrypt.compare(password, user.password, (err, result) => {
      if (!result) {
        req.flash("error", "Incorrect password.");
        return res.redirect("/user/login");
      }
    })
     // 6. Check if OTP was already sent in last 24 hours

     if(user.loginOtpSentAt && Date.now() - user.loginOtpSentAt < 24*60*60*1000){
      req.flash("error", "New otp can only be sent after 24 hours.");
      return res.render("login", { error: req.flash("error"), showOtp: true, email });
     }

      // 7. Generate and send OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.loginotp = generatedOtp;
      user.loginOtpExpiresAt = Date.now() + 5*60*1000;
      user.loginOtpSentAt = Date.now();
      await user.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth:{
          user:process.env.EMAIL_USER,
          pass:process.env.EMAIL_PASS,
        }
      })

      await transporter.sendMail({
        from:process.env.EMAIL_USER,
        to:email,
        subject:"your otp to login",
        text:`your otp is ${generatedOtp}`
      })
       req.flash("success", "OTP sent to your email.");
    return res.render("login", { success: req.flash("success"), showOtp: true, email });

  }

  catch (err) {
    req.flash("error", err.message)
    res.redirect("/user/login")
  }
}


authcontroller.logout = async (req, res) => {
  try {
    await usermodel.findOneAndUpdate({ email: req.user.email }, { isloggedin: false })
    res.clearCookie("token")
    res.status(200).redirect("/user/signup")
  }
  catch (err) {
    req.flash("error", err.message)
    res.redirect("/user/login")
  }
}

module.exports = authcontroller