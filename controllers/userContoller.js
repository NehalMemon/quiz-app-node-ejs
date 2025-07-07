// controllers/quizController.js
const userController = {};
const Quiz = require("../models/quiz-model");
const User = require("../models/user-model");

userController.reportsGet = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("reports.quizId");
    
        res.render("profile", {
          user,
          reports: user.reports || [],
          error: req.flash("error")[0] || null,
          success: req.flash("success")[0] || null
        });
      } catch (err) {
        console.error("Profile Load Error:", err);
        req.flash("error", "Could not load profile");
        return res.redirect("/");
      }
    };

module.exports = { userController };

