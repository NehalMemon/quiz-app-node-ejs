const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");
const adminModel = require("../models/admin-model");

const checkSubscription = async (req, res, next) => {
  try {
    const { userToken, adminToken } = req.cookies;

    // ✅ Allow admin to bypass subscription check
    if (adminToken) {
      const decoded = jwt.verify(adminToken, process.env.JWT_KEY);
      const admin = await adminModel.findOne({ email: decoded.email }).select("-password");
      if (admin) {
        req.admin = admin;
        return next();
      }
    }

    // ✅ Check user subscription
    if (userToken) {
      const decoded = jwt.verify(userToken, process.env.JWT_KEY);
      const user = await userModel.findOne({ email: decoded.email }).select("-password");

      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/user/login");
      }

      const now = new Date();
      if (user.isSubscribed && user.subscriptionEnd > now) {
        req.user = user;
        return next();
      } else {
        req.flash("error", "Your subscription has expired or is inactive.");
        return res.redirect("/subscription/upgrade");
      }
    }

    req.flash("error", "You must be logged in");
    return res.redirect("/user/login");

  } catch (err) {
    console.error("Error in checkSubscription middleware:", err);
    req.flash("error", "Session error. Please log in again.");
    return res.redirect("/user/login");
  }
};

module.exports = checkSubscription;
