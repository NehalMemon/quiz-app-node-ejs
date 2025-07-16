const isAdmin = (req, res, next) => {
  try {
    // Ensure req.admin exists and is an admin
    if (!req.admin || !req.admin.isAdmin) {
      req.flash("error", "Only admin can access this page.");
      return res.redirect("/admin/login");
    }
    next();
  } catch (err) {
    console.error("isAdmin middleware error:", err);
    req.flash("error", "Something went wrong.");
    return res.redirect("/");
  }
};

module.exports = isAdmin;
