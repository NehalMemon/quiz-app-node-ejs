module.exports = function validate(schema, options = {}) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details[0].message;

      // Save old form data to session for reuse
      req.session.tempUser = req.body;

      // If a view is specified, render it with error + old input
      if (options.renderView) {
        return res.render(options.renderView, {
          layout: false,
          error: errorMessage,
          success: null,
          old: req.body,
          showOtp: !!req.body.signupOtp,
        });
      }

      // Otherwise flash message and redirect
      req.flash("error", errorMessage);
      return res.redirect(options.redirectTo || "back");
    }

    next();
  };
};
