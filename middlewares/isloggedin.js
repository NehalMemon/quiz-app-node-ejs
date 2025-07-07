const jwt = require("jsonwebtoken");
const adminModel = require("../models/admin-model");
const userModel = require("../models/user-model");

const isUserloggedin = async (req, res, next) => {
  const token = req.cookies.userToken;

  if (!token) {
    req.flash("error", "You must be logged in to access this page.");
    return res.redirect("/user/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findOne({ email: decoded.email }).select("-password");

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/user/login");
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("User token verification failed:", err);
    req.flash("error", "Session expired. Please login again.");
    return res.redirect("/user/login");
  }
};

const isAdminloggedin = async (req, res, next) => {
  const token = req.cookies.adminToken;
  
  if (!token) {
    req.flash("error", "You must be logged in to access this page.");
    return res.redirect("/admin/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const admin = await adminModel.findOne({ email: decoded.email }).select("-password");

    if (!admin) {
      req.flash("error", "Admin not found.");
      return res.redirect("/admin/login");
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("Admin token verification failed:", err);
    req.flash("error", "Session expired. Please login again.");
    return res.redirect("/admin/login");
  }
};

const isUserOrAdmin = async (req, res, next) => {
  try {
    const { userToken, adminToken } = req.cookies;

    if (userToken) {
      const decoded = jwt.verify(userToken, process.env.JWT_KEY);
      const user = await userModel.findOne({ email: decoded.email }).select("-password");

      if (user) {
        req.user = user;
        return next();
      }
    }

    if (adminToken) {
      const decoded = jwt.verify(adminToken, process.env.JWT_KEY);
      const admin = await adminModel.findOne({ email: decoded.email }).select("-password");

      if (admin) {
        req.admin = admin;
        return next();
      }
    }

    req.flash("error", "You must be logged in");
    return res.redirect("/user/login");

  } catch (err) {
    console.error("Token verification failed in isUserOrAdmin:", err);
    req.flash("error", "Session expired. Please login again.");
    return res.redirect("/user/login");
  }
};


module.exports = { isUserloggedin, isAdminloggedin, isUserOrAdmin };
