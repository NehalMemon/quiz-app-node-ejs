
const usermodel = require("../models/user-model");
const adminModel = require("../models/admin-model");
const quizModel = require("../models/quiz-model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const {UsertokenGenerator,AdmintokenGenerator} = require("../utils/token");

const authController = {};

// ================= USER SIGNUP =================
authController.signupGet = (req, res) => {
  const sessionData = req.session.tempUser || {};

  res.render("User-signup", {
    layout: false,
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    showOtp: !!sessionData.signupOtp,  // Show OTP input if OTP was generated
    old: {
      userName: sessionData.userName || "",
      email: sessionData.email || "",
    },
  });
};


authController.signupPost = async (req, res) => {
  try {
    const { userName, email, password, signupOtp, resendOtp, yearOfStudy } = req.body;
    const sessionData = req.session.tempUser;

    if (resendOtp) {
      if (!sessionData) {
        req.flash("error", "Session expired.");
        return res.redirect("/user/signup");
      }
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionData.signupOtp = newOtp;
      sessionData.signupOtpExpiry = Date.now() + 5 * 60 * 1000;

      await sendOtpEmail(sessionData.email,newOtp, "Your New OTP Code", true);
      

      req.flash("success", "New OTP sent to your email.");
      return res.render("User-signup", {
        layout: false,
        error: null,
        success: req.flash("success")[0],
        showOtp: true,
        old: sessionData || {}
      });
      
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
        return res.render("User-signup", {
          layout: false,
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
        yearOfStudy: sessionData.yearOfStudy

      });

      req.session.tempUser = null;
      const token = UsertokenGenerator(newUser);
      res.cookie("userToken", token, { httpOnly: true });


      req.session.user = {
        _id: newUser._id,
        name: newUser.name,
        isAdmin: newUser.isAdmin  // <-- this must exist if admin
      };
      

      req.flash("success", "User created successfully");
      return res.redirect("/");
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
      yearOfStudy,
      signupOtp: otp,
      signupOtpExpiry: Date.now() + 5 * 60 * 1000,
    };

    await sendOtpEmail(email,otp, "Your Signup OTP Code", true);

    

    req.flash("success", "OTP sent to your email.");
    return res.render("User-signup", {
      layout: false,
      success: req.flash("success")[0],
      error: null,
      showOtp: true,
      old: { userName, email, yearOfStudy },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    req.flash("error", "Server error occurred.");
    return res.redirect("/user/signup");
  }
};

// ================= USER LOGIN =================


// GET: Login Page
authController.loginGet = (req, res) => {
  let tempData = {};
  try {
    const decoded = req.cookies.tempLogin
      ? jwt.verify(req.cookies.tempLogin, process.env.JWT_SECRET)
      : {};
    tempData = decoded;
  } catch {}

  res.render("User-login", {
    layout: false,
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    showOtp: !!tempData.userId,
    email: tempData.email || "",
  });
};

// POST: Handle Login
authController.loginPost = async (req, res) => {
  try {
    const { email, password, signupOtp, resendOtp } = req.body;

    // ✅ Handle Resend OTP
    if (resendOtp) {
      let decoded;
      try {
        decoded = jwt.verify(req.cookies.tempLogin, process.env.JWT_KEY);
      } catch {
        req.flash("error", "Session expired. Please login again.");
        return res.redirect("/user/login");
      }

      const user = await usermodel.findById(decoded.userId);
      if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/user/login");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.loginOtp = otp;
      user.loginOtpExpiresAt = Date.now() + 5 * 60 * 1000;
      await user.save();

      await sendOtpEmail(user.email, otp, "Your Login OTP Code", true);

      req.flash("success", "New OTP sent to your email.");
      return res.render("User-login", {
        layout: false,
        error: null,
        success: req.flash("success")[0],
        showOtp: true,
        email: user.email,
      });
    }

    // ✅ Common email typo fixes
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

    // ✅ OTP Verification
    if (signupOtp) {
      if (!user.loginOtp || !user.loginOtpExpiresAt) {
        req.flash("error", "No OTP requested for this account.");
        return res.render("User-login", {
          error: req.flash("error")[0],
          success: null,
          showOtp: true,
          email,
        });
      }

      if (user.loginOtp !== signupOtp || Date.now() > user.loginOtpExpiresAt) {
        req.flash("error", "Invalid or expired OTP.");
        return res.render("User-login", {
          layout: false,
          error: req.flash("error")[0],
          success: null,
          showOtp: true,
          email,
        });
      }

      // ✅ Block re-login within 24 hours
      if (user.lastLogin && Date.now() - user.lastLogin.getTime() < 86400000) {
        const hoursLeft = ((86400000 - (Date.now() - user.lastLogin.getTime())) / 3600000).toFixed(1);
        req.flash("error", `This account is already logged in. Try again in ${hoursLeft} hours.`);
        return res.redirect("/user/login");
      }

      // ✅ Finalize login
      user.isLoggedIn = true;
      user.lastLogin = new Date();
      user.loginOtp = user.loginOtpExpiresAt = user.loginOtpSentAt = null;
      await user.save();

      const token = UsertokenGenerator(user);
      res.clearCookie("tempLogin");
      res.cookie("userToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      req.session.user = {
        _id: user._id,
        name: user.name,
        isAdmin: user.isAdmin  // <-- this must exist if admin
      };

      req.flash("success", "Logged in successfully.");
      return res.redirect("/");
    }

    // ✅ Validate Password and send OTP
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      req.flash("error", "Incorrect password.");
      return res.redirect("/user/login");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = otp;
    user.loginOtpExpiresAt = Date.now() + 5 * 60 * 1000;
    user.loginOtpSentAt = Date.now();
    await user.save();

    // ✅ Save temp data in cookie (instead of session)
    const tempPayload = {
      userId: user._id,
      email: user.email,
    };
    const tempToken = jwt.sign(tempPayload, process.env.JWT_KEY, { expiresIn: "10m" });
    res.cookie("tempLogin", tempToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    await sendOtpEmail(email, otp, "Your Login OTP Code", true);

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

    req.flash("success", "Logged out successfully");

    // Destroy the session and only redirect once
    req.session.destroy(err => {
      if (err) {
        console.error("Session destroy error:", err);
        req.flash("error", "Could not log out properly.");
        return res.redirect("/user/login");
      }

      // Only send headers once
      res.clearCookie("userToken");
      return res.redirect("/user/login");
    });

  } catch (err) {
    console.error("Logout error:", err);
    req.flash("error", err.message);
    return res.redirect("/user/login");
  }
};


// ================= ADMIN CONTROLLER =================
const adminController = {};

adminController.signupGet = (req, res) => {
  res.render("Admin-signup", { layout: false, error: null, success: null });
};

adminController.signupPost = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const hash = await bcrypt.hash(password , 10);
    const admin = await adminModel.create({ userName, email, password: hash });

 
    const token = AdmintokenGenerator(admin);
    res.cookie("adminToken", token, { httpOnly: true, maxAge: 3600000 });
   
    req.session.user = {
      _id: admin._id,
      name: admin.name,
      isAdmin: admin.isAdmin  // <-- this must exist if admin
    };
    
    req.flash("success", "Admin account created successfully");
    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Admin Signup Error:", err);
    req.flash("error", "Signup failed");
    return res.redirect("/");
  }
};

adminController.loginGet = (req, res) => {
 
  res.render("Admin-login", {
    layout: false,
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
    req.session.user = {
      _id: admin._id,
      name: admin.name,
      isAdmin: admin.isAdmin  // <-- this must exist if admin
    };
    
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

    req.flash("success", "Logged out successfully");

    // ✅ Only redirect inside the callback — remove the one below
    req.session.destroy(err => {
      if (err) {
        console.error("Session destroy error:", err);
        req.flash("error", "Could not log out properly.");
        return res.redirect("/admin/login");
      }

      res.clearCookie("adminToken");
      return res.redirect("/admin/login");
    });

    // ❌ Remove this — it causes the error
    // return res.redirect("/admin/login");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/admin/login");
  }
};



adminController.dashboardGet = async (req, res) => {
  const users = await usermodel.find({});
  const quizzes = await quizModel.find({});
  const activeQuizzes = await quizModel.find({isActive:true });
  const inactiveQuizzes = await quizModel.find({isActive:false });
  res.render("Dashboard",
    {
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
      users,
      quizzes,
      activeQuizzes,
      inactiveQuizzes,
    }
  );
}


authController.forgotPasswordPost =async (req, res) => {
  try {
    const { email } = req.body;
    const user = await usermodel.findOne({ email });

    if (!user) {
      req.flash("error", "No account found with this email.");
      return res.redirect("/user/forgot-password");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 min expiry
    await user.save();

    await sendOtpEmail(user.email, otp, "Your Password Reset OTP");

    req.session.resetEmail = email;
    req.flash("success", "OTP sent to your email.");
    res.redirect("/user/reset-password");
  } catch (err) {
    console.error("OTP send error:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/user/forgot-password");
  }
};

authController.forgotPasswordGet = (req, res) => {
  res.render("forget-password", {
    layout: false,
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null
  });
};

authController.resetPasswordGet = (req, res) => {
  res.render("reset-password", {
    layout: false,
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    email: req.session.resetEmail || "",
  });
};


authController.resetPasswordPost = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const email = req.session.resetEmail;

    const user = await usermodel.findOne({ email });

    if (!user || !user.resetOtp || !user.resetOtpExpiresAt) {
      req.flash("error", "Invalid or expired OTP.");
      return res.redirect("/user/reset-password");
    }

    const now = Date.now();
    if (user.resetOtp !== otp || now > user.resetOtpExpiresAt) {
      req.flash("error", "OTP is invalid or expired.");
      return res.redirect("/user/reset-password");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = user.resetOtpExpiresAt = null;
    await user.save();

    req.session.resetEmail = null;
    req.flash("success", "Password updated successfully.");
    res.redirect("/user/login");
  } catch (err) {
    console.error("Password reset error:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/user/reset-password");
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

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #0056b3;">DoctorQuizz ${subject.includes("Login") ? "Login" : "Signup"} Verification</h2>
      <p>Hello,</p>
      <p>We received a request to ${subject.includes("Login") ? "log in to" : "sign up for"} your DoctorQuizz account.</p>
      <p>Use the OTP below to complete your ${subject.includes("Login") ? "login" : "registration"}:</p>

      <div style="font-size: 24px; font-weight: bold; color: #222; margin: 20px 0;">${otp}</div>

      <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone for your account’s security.</p>

      <p>If you did not attempt to ${subject.includes("Login") ? "log in" : "sign up"}, we recommend changing your password and contacting our support team immediately.</p>

      <br/>
      <p>Best regards,<br/>The DoctorQuizz Team</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    [isHTML ? "html" : "text"]: isHTML
      ? htmlTemplate
      : `Your OTP is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { authController, adminController };