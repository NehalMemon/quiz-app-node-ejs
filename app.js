const express = require('express');
const app = express();

// const year = require("./models/year-model")
// const Module = require("./models/module-model")
const userRouter= require("./routes/userRouter");
const indexRouter= require("./routes/indexRouter");
const adminRouter= require("./routes/adminRouter");
const paymentRouter= require("./routes/paymentRouter");
const path = require('path');
const coookieParser=require("cookie-parser")
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require('connect-flash');

require("dotenv").config()
require("./config/db")()


app.use(coookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"src")))
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname,"public")))
app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // use your existing MongoDB connection string
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 30, // 30 days in seconds
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  }
}));
app.use(flash())

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });



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
// app.use("/api/payment" , paymentRouter)


// const creater = async () => {
// const fifthYear = await year.findOne({name : "5"})
// const secondYear = await year.findOne({name : "2"})
//  await Module.findByIdAndUpdate("687f92841acde89076811e1a",{year : secondYear._id})

// }

// creater()

app.listen(3000 , '0.0.0.0', ()=>{
    console.log("server is running on port 3000")
})