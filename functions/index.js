const functions = require("firebase-functions");
const express = require("express");
const app = express();
const {
  getAllPosts,
  newPost,
  getPost,
  commentPost,
} = require("./handler/post");
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getProfile,
} = require("./handler/user");
const tokenAuth = require("./util/auth");

//retrieve all post
app.get("/allPosts", getAllPosts);

//post new post
app.post("/post", tokenAuth, newPost);

//retrieve specific post
app.get("/post/:postId", getPost);

//comment a post
app.post("/post/:postId/comment", tokenAuth, commentPost);

//sign up as new user
app.post("/signup", signUp);

//login
app.post("/login", login);

//upload image
app.post("/user/img", tokenAuth, uploadImage);

//add user details
app.post("/user/detail", tokenAuth, addUserDetails);

//get own details
app.get("/user", tokenAuth, getProfile);

exports.api = functions.region("us-central1").https.onRequest(app);
