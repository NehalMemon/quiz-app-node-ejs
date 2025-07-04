
const usermodel = require("../models/user-model");
const adminModel = require("../models/admin-model");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const {UsertokenGenerator,AdmintokenGenerator} = require("../utils/token");

const authController = {};

// ================= USER SIGNUP =================
authController.signupGet = (req, res) => {
  res.render("signup", {
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    showOtp: false,
    old: req.flash("old")[0] || {},
  });
};

authController.signupPost = async (req, res) => {
  try {
    const { userName, email, password, signupOtp, resendOtp } = req.body;
    const sessionData = req.session.tempUser;

    if (resendOtp) {
      if (!sessionData) {
        req.flash("error", "Session expired.");
        return res.redirect("/user/signup");
      }
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionData.signupOtp = newOtp;
      sessionData.signupOtpExpiry = Date.now() + 5 * 60 * 1000;

      await sendOtpEmail(sessionData.email, newOtp, "Your New OTP Code");

      req.flash("success", "New OTP sent to your email.");
      return res.redirect("/user/signup");
    }

    if (email && email.includes("@")) {
      const [localPart, domain] = email.split("@");
      const typoFix = {
        "gamil.com": "gmail.com",
        "gnail.com": "gmail.com",
        "hotnail.com": "hotmail.com",
        "yaho.com": "yahoo.com",
      };
      if (typoFix[domain]) {
        req.flash("error", `Did you mean ${localPart}@${typoFix[domain]}?`);
        return res.redirect("/user/signup");
      }
    }

    if (signupOtp) {
      if (
        !sessionData ||
        sessionData.signupOtp !== signupOtp ||
        Date.now() > sessionData.signupOtpExpiry
      ) {
        req.flash("error", "Invalid or expired OTP.");
        return res.render("signup", {
          error: req.flash("error")[0],
          success: null,
          showOtp: true,
          old: sessionData || {},
        });
      }

      const hashedPassword = await bcrypt.hash(sessionData.password, 10);
      const newUser = await usermodel.create({
        userName: sessionData.userName,
        email: sessionData.email,
        password: hashedPassword,
      });

      req.session.tempUser = null;
      const token = UsertokenGenerator(newUser);
      res.cookie("userToken", token, { httpOnly: true });

      req.flash("success", "User created successfully");
      return res.redirect("/home");
    }

    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email already registered.");
      return res.redirect("/user/signup");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.tempUser = {
      userName,
      email,
      password,
      signupOtp: otp,
      signupOtpExpiry: Date.now() + 5 * 60 * 1000,
    };

    await sendOtpEmail(email, otp, "Your OTP Code");

    req.flash("success", "OTP sent to your email.");
    return res.render("signup", {
      success: req.flash("success")[0],
      error: null,
      showOtp: true,
      old: { userName, email },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    req.flash("error", "Server error occurred.");
    return res.redirect("/user/signup");
  }
};

// ================= USER LOGIN =================
authController.loginGet = (req, res) => {
  res.render("login", {
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    showOtp: false,
  });
};

authController.loginPost = async (req, res) => {
  try {
    let { email, password, signupOtp } = req.body;

    if (!email) {
      req.flash("error", "Email is required.");
      return res.redirect("/user/login");
    }

    const domain = email.split("@")[1];
    const typos = {
      "gamil.com": "gmail.com",
      "gnail.com": "gmail.com",
      "hotnail.com": "hotmail.com",
      "yaho.com": "yahoo.com",
    };
    if (typos[domain]) {
      const suggestion = `${email.split("@")[0]}@${typos[domain]}`;
      req.flash("error", `Did you mean ${suggestion}?`);
      return res.redirect("/user/login");
    }

    const user = await usermodel.findOne({ email });
    if (!user) {
      req.flash("error", "No user found with this email.");
      return res.redirect("/user/login");
    }

    if (signupOtp) {
      if (!user.loginOtp || !user.loginOtpExpiresAt) {
        req.flash("error", "No OTP requested for this account.");
        return res.render("login", { error: req.flash("error")[0], success: null, showOtp: true, email });
      }

      if (user.loginOtp !== signupOtp || Date.now() > user.loginOtpExpiresAt) {
        req.flash("error", "Invalid or expired OTP.");
        return res.render("login", { error: req.flash("error")[0], success: null, showOtp: true, email });
      }

      user.isLoggedIn = true;
      user.loginOtp = user.loginOtpExpiresAt = user.loginOtpSentAt = null;
      await user.save();

      const token = UsertokenGenerator(user);
      res.cookie("userToken", token, { httpOnly: true, secure: false, sameSite: "strict" });

      req.flash("success", "Logged in successfully.");
      return res.redirect("/home");
    }

    if (user.isLoggedIn) {
      req.flash("error", "This account is already in use on another device.");
      return res.redirect("/user/login");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      req.flash("error", "Incorrect password.");
      return res.redirect("/user/login");
    }

    if (user.loginOtpSentAt && Date.now() - user.loginOtpSentAt < 86400000) {
      const hoursLeft = ((86400000 - (Date.now() - user.loginOtpSentAt)) / 3600000).toFixed(1);
      req.flash("error", `Please wait ${hoursLeft} hours before requesting a new OTP.`);
      return res.render("login", { error: req.flash("error")[0], success: null, showOtp: true, email });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = otp;
    user.loginOtpExpiresAt = Date.now() + 5 * 60 * 1000;
    user.loginOtpSentAt = Date.now();
    await user.save();

    await sendOtpEmail(email, otp, "Your Login OTP Code", true);

    req.flash("success", "OTP sent to your email. Check your inbox!");
    return res.render("login", {
      error: null,
      success: req.flash("success")[0],
      showOtp: true,
      email,
    });
  } catch (err) {
    console.error("Login Error:", err);
    req.flash("error", "An unexpected error occurred.");
    return res.redirect("/user/login");
  }
};

authController.logout = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.userToken, process.env.JWT_KEY);
    await usermodel.findOneAndUpdate({ email: decoded.email }, { isLoggedIn: false });
    res.clearCookie("userToken");
    return res.redirect("/user/login");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/user/login");
  }
};

// ================= ADMIN CONTROLLER =================
const adminController = {};

adminController.signupGet = (req, res) => {
  res.render("adminsignup", { error: null, success: null });
};

adminController.signupPost = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const hash = await bcrypt.hash(password , 10);
    const admin = await adminModel.create({ userName, email, password: hash });

    console.log("ADMIN CREATED ✅:", admin);
    const token = AdmintokenGenerator(admin);
    res.cookie("adminToken", token, { httpOnly: true, maxAge: 3600000 });
    console.log("ADMIN TOKEN SET ✅:", token);
    req.flash("success", "Admin account created successfully");
    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Admin Signup Error:", err);
    req.flash("error", "Signup failed");
    return res.redirect("/home");
  }
};

adminController.loginGet = (req, res) => {
  res.render("adminLogin", {
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
  });
};

adminController.loginPost = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminModel.findOne({ email });
    if (!admin || !admin.isAdmin) {
      req.flash("error", "No admin found with this email.");
      return res.redirect("/admin/login");
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      req.flash("error", "Incorrect password.");
      return res.redirect("/admin/login");
    }

    const token = AdmintokenGenerator(admin);
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    req.flash("success", "Logged in successfully.");
    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Admin Login Error:", err);
    req.flash("error", "An unexpected error occurred.");
    return res.redirect("/admin/login");
  }
};

adminController.logout = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.adminToken, process.env.JWT_KEY);
    await adminModel.findOneAndUpdate({ email: decoded.email }, { isLoggedIn: false });
    res.clearCookie("adminToken");
    return res.redirect("/admin/login");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/admin/login");
  }
};

// =============== HELPER FUNCTION ===================
async function sendOtpEmail(to, otp, subject, isHTML = false) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    [isHTML ? "html" : "text"]: isHTML
      ? `<h2>Your OTP</h2><p>${otp}</p>`
      : `Your OTP is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { authController, adminController };