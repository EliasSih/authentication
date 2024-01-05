//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const flash = require('connect-flash');





const bcrypt = require('bcrypt');
const saltRounds = 10;



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });


mongoose.connection.on('open', () => {
  console.log("Successfully connected to MongoDB Atlas!");
});

mongoose.connection.on('error', (err) => {
  console.error("MongoDB connection error:", err);
});


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(flash());

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

var userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']});




app.get("/", function (req, res){
  res.render("home");
});

app.get("/login", async function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/register", function(req, res){

  username = req.body.username;
  password = req.body.password;

  User.register({username: username, active: false}, password, function(err, user){
    if (err){
      console.log(err);
    }

    const authenticate = User.authenticate();
    authenticate(username, password, function(err, results){
      if(err){
        console.log(err);
        res.send("something went wrong");
      }
      else{
        res.render("secrets");
      }
    })
  })
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res) {
    const errors = req.flash('error');
    console.log("login errors:", errors);
    res.redirect("/secrets");
});

app.get('/logout', function(req, res) {
  req.logout(function(err){

    if(err){
      return next(err);
    }

    res.redirect('/');

  });
});

app.listen(5000, function(){
  console.log("server started on port 5000")
});
