//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var mongoose = require('mongoose');
var encrypt = require('mongoose-encryption');



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

const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);


app.get("/", function (req, res){
  res.render("home");
});

app.get("/login", async function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){

  bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User ({
          email: req.body.username,
          password: hash
        });

        newUser.save()
          .then(() => {
            res.render("secrets");
            console.log("User", newUser.email);
          })
          .catch(err => {
            console.log(err);
          });
    });
  });

});

app.post("/login", function(req, res){
  const username = req.body.username;

  User.findOne({email: username})
    .then(foundUser => {
      if (foundUser) {
        bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
          if (result) {
            // Passwords match
            res.render("secrets");
            console.log("Hash Result: Success");
          } else {
            // Passwords don't match
            console.log("Hash Result: Failure");
            res.send("invalid username or password");
          }
        });
      } else {
        console.log("No user found");
      }
    })
    .catch(err => {
      console.log(err);
      res.send("An error occurred.");
    });
});


app.listen(5000, function(){
  console.log("server started on port 5000")
});
