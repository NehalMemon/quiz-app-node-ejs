module.exports = function validate(schema, options = {}) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      if (options.flashAndRedirect) {
        req.flash("error", error.details[0].message);
        return res.redirect(options.redirectTo || "back");
      } else {
        return res.status(400).json({ error: error.details[0].message });
      }
    }
    next();
  };
};
