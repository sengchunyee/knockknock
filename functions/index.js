const functions = require("firebase-functions");
const express = require("express");
const app = express();
const { getAllPosts, newPost } = require("./handler/post");
const { signUp, login } = require("./handler/user");
const tokenAuth = require("./util/auth");

//retrieve all post
app.get("/allPosts", getAllPosts);

//post new post
app.post("/knock", tokenAuth, newPost);

//sign up as new user
app.post("/signup", signUp);

//login
app.post("/login", login);

exports.api = functions.region("us-central1").https.onRequest(app);
