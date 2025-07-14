const User = require("../models/user-model");

const isActive = async (req , res , next) => {
    try{
        let ActiveUser = req.user;
        if(ActiveUser){  
            if(!ActiveUser.isActive){
            req.flash("error" , "your account is not active, try again later , if problem persist contact admin")
            return res.redirect("/home");
        }}
        next();
    }
    catch(err){
    console.error("isActive middleware error:", err);
    req.flash("error", "Something went wrong.");
    return res.redirect("/home");
    }
}

module.exports = isActive;