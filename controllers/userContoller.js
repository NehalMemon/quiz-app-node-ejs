// controllers/quizController.js
const userController = {};
const Quiz = require("../models/quiz-model");
const User = require("../models/user-model");

userController.reportsGet = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("reports.quizId");
    
        res.render("Profile", {
          user,
          isAdmin: req.admin?.isAdmin || false,
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



userController.viewReportDetail =  async (req, res) => {
  const user = await User.findById(req.user._id);
  const index = parseInt(req.params.id);
  const report = user.reports[index];

  if (!report || !report.detailedResults) {
    req.flash("error", "Report not found.");
    return res.redirect("/user/profile");
  }

  res.render("Report-detail", {
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
    report
  });
};




userController.viewUsersGet = async (req , res) => {
  try{
    const { name, email } = req.query;
    const filters = {};

    if (name) filters.userName = { $regex: name, $options: "i" };
    if (email) filters.email = { $regex: email, $options: "i" };

    const users = await User.find(filters).select("-password");
    if(!users){
      req.flash("error" , "No users found");
      return res.redirect("/admin/dashboard");
    }
    res.render("Users" , {
      users,
      name: name || '',
      email: email || '',
      isAdmin: req.admin?.isAdmin || false,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null

    })
  }
  catch (err) {
    console.error("Profile Load Error:", err);
    req.flash("error", "Could not load profile");
    return res.redirect("/admin/dashboard");
}
}


userController.controlUsersGet = async (req , res) => {
  try{
    const user = await User.findById(req.params.id).select("-password");
    if(!user){
      req.flash("error" , "User not found");
      return res.redirect("/admin/users");
    }
    res.render("Profile" , {
      user , isAdmin: req.admin?.isAdmin || false,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null
    })
  }
  catch (err) {
    console.error("Profile Load Error:", err);
    req.flash("error", "Could not load profile");
    return res.redirect("/admin/users");
}
}


userController.deleteUsersPost = async (req , res) => {
  try{
    await User.findByIdAndDelete(req.params.id);
    req.flash("success", "User deleted successfully"); // ✅ Flash first

    req.session.destroy(err => {
      if (err) {
        console.error("Session destroy error:", err);
        req.flash("error", "Could not complete logout.");
        return res.redirect(`/user/profile/${req.params.id}`);
      }

      res.clearCookie("userToken");
      return res.redirect("/");
    });
  }
  catch (err) {
    console.error("Error:", err);
    req.flash("error", "Could not delete user");
    return res.redirect(`/user/profile/${req.params.id}`); 
  }
}


userController.activationUsersPost = async (req , res) => {
  try{
    const user = await User.findById(req.params.id)
   if(user.isActive){
    user.isActive = false;
    await user.save();
    req.flash("success" , "User deactivated successfully");
    res.redirect(`/admin/user/${req.params.id}`);
   }
   else{
    user.isActive = true;
    await user.save();
    req.flash("success" , "User activated successfully");
    res.redirect(`/admin/user/${req.params.id}`);
  }
}
  catch (err) {
    console.error("Error:", err);
    req.flash("error", "Could not activate user");
    return res.redirect(`/admin/user/${req.params.id}`);
  }
}


userController.homeGet =  async (req, res) => {
  const email = req.user.email;
  const user = await usermodel.findOne({email});
    res.render("Home", {
      user,
      error: req.flash("error")[0] || null,
      success: req.flash("success")[0] || null,
    });
  }

module.exports = { userController };

