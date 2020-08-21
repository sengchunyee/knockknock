const functions = require("firebase-functions");
const express = require("express");
const app = express();
const {
  getAllPosts,
  newPost,
  getPost,
  commentPost,
  likePost,
  unlikePost,
  deletePost,
} = require("./handler/post");
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getProfile,
  getOtherUserProfile,
  markNotificationsRead,
} = require("./handler/user");
const tokenAuth = require("./util/auth");
const { db } = require("./util/admin");

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

//like post
app.get("/post/:postId/like", tokenAuth, likePost);

//unlike post
app.get("/post/:postId/unlike", tokenAuth, unlikePost);

//delete post
app.delete("/post/:postId", tokenAuth, deletePost);

//get other user profile
app.get("/user/:handle", getOtherUserProfile);

//mark notifications read
app.post("/notifications", tokenAuth, markNotificationsRead);

exports.api = functions.region("us-central1").https.onRequest(app);

//send notifications on liking a post
exports.createNotificationOnLike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    db.doc(`/knock/${snapshot.data().postId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            postId: doc.id,
          });
        }
        return;
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//send notifications on commenting a post
exports.createNotificationOnComment = functions
  .region("us-central1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    db.doc(`/knock/${snapshot.data().postId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            postId: doc.id,
          });
        }
        return;
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

//send notifications on unliking a post
exports.deleteNotificationOnUnlike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
      });
  });
