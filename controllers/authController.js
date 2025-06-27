const usermodel = require("../models/user-model")
const bcrypt = require("bcrypt")

const tokenGenerator = require("../utils/token")

const authcontroller = {};
authcontroller.signupPost = async (req, res) => {
    try {
        let { user_name, email, password } = req.body


        const domain = email.split("@")[1];
        const commonEmailTypos = {
            "gamil.com": "gmail.com",
            "gnail.com": "gmail.com",
            "hotnail.com": "hotmail.com",
            "yaho.com": "yahoo.com"
        };

        if (commonEmailTypos[domain]) {
            req.flash("error", `Did you mean ${email.split("@")[0]}@${commonEmailTypos[domain]}?`);
            return res.redirect("/user/signup");
        }
        let existingUser = await usermodel.findOne({ email });
        if (existingUser) {
            req.flash("error", "email already registered.")
            return res.redirect("/user/signup")
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        let user = await usermodel.create({
            user_name, email, password: hash
        })

        let token = tokenGenerator(user)
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        req.flash("success", "user created successfully")
        res.redirect("/user/signup")
    }
    catch (err) {
        req.flash("error", err.message)
        res.redirect("/user/signup")
    }
}


authcontroller.signupGet = (req, res) => {
    let error = req.flash("error")
    let success = req.flash("success")
    res.render("signup", {
        error: error.length > 0 ? error[0] : null,
        success: success.length > 0 ? success[0] : null
    })
}


authcontroller.loginGet = (req, res) => {
    let error = req.flash("error")
    let success = req.flash("success")
    res.render("login", {
        error: error.length > 0 ? error[0] : null,
        success: success.length > 0 ? success[0] : null
    })
}

authcontroller.loginPost = async (req, res) => {
    try {
        let { email, password } = req.body;

        const domain = email.split("@")[1];
        const commonEmailTypos = {
            "gamil.com": "gmail.com",
            "gnail.com": "gmail.com",
            "hotnail.com": "hotmail.com",
            "yaho.com": "yahoo.com"
        };

        if (commonEmailTypos[domain]) {
            req.flash("error", `Did you mean ${email.split("@")[0]}@${commonEmailTypos[domain]}?`);
            return res.redirect("/user/signup");
        }

        let user = await usermodel.findOne({ email });

        if (!user) {
            req.flash("error", "No user found ")
            return res.redirect("/user/login")
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                let token = tokenGenerator(user);
                res.cookie("token", token, {
                    httpOnly: true
                })
                res.redirect("/home.ejs")
            }
            else {
                return res.status(400).send("credentials are not valid")
            }
        })

    }

    catch (err) {
        req.flash("error", err.message)
        res.redirect("/user/login")
    }
}


authcontroller.logout = (req, res) => {
    try {
        res.clearCookie("token")
        res.status(200).redirect("/user/signup")
    }
    catch (err) {
        req.flash("error", err.message)
        res.redirect("/user/login")
    }
}

module.exports = authcontroller