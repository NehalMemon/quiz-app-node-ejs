const express = require('express');
const app = express();


const userRouter= require("./routes/userRouter");
const indexRouter= require("./routes/indexRouter");
const adminRouter= require("./routes/adminRouter");
const path = require('path');
const coookieParser=require("cookie-parser")
const expressSession = require("express-session")
const flash = require('connect-flash');

require("dotenv").config()
require("./config/db")()


app.use(coookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"src")))
app.use(express.static(path.join(__dirname,"public")))
app.use(expressSession({
    resave:false,
    saveUninitialized:false,
    secret: process.env.EXPRESS_SESSION_SECRET
}));
app.use(flash())

app.use((req, res, next) => {
    const user = req.session.user || null;
    res.locals.title = "MedQuiz";
    res.locals.currentRoute = req.path;
    res.locals.user = user;
    res.locals.admin = user?.isAdmin || false;
  
    next();
  });
  


const expressLayouts = require('express-ejs-layouts');
app.set("view engine" , "ejs")
app.use(expressLayouts)
app.set('layout', 'layouts/main');


app.use("/" , indexRouter)
app.use("/user" , userRouter)
app.use("/admin" , adminRouter)



app.listen(3000 , '0.0.0.0', ()=>{
    console.log("server is running on port 3000")
})