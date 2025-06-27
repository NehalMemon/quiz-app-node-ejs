const express = require('express');
const app = express();


const userrouter= require("./routes/userRouter");
const indexrouter= require("./routes/indexRouter");
const path = require('path');
const coookieParser=require("cookie-parser")
const mongoose = require('mongoose');
const expressSession = require("express-session")
const flash = require('connect-flash');
require("dotenv").config()


require("./config/db")()


app.use(coookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")))
app.use(expressSession({
    resave:false,
    saveUninitialized:false,
    secret: process.env.EXPRESS_SESSION_SECRET
}));
app.use(flash())

app.set("view engine" , "ejs")



app.use("/user" , userrouter)

// app.use("/",indexrouter)

app.listen(3000 , ()=>{
    console.log("server is running on port 3000")
})