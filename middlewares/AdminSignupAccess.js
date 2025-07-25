module.exports = (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
      return next(); // Allow access
    }
    return res.status(403).send("Access Denied");
  };