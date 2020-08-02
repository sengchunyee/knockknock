const serviceAccount = require("../knockknock-6bda4-firebase-adminsdk-ixft2-37805485f7.json");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");
const express = require("express");
const app = express();

const firebaseConfig = {
  apiKey: "AIzaSyAJP0xVUFF9-2HZ6QifbQs8l-trqYZaxiQ",
  authDomain: "knockknock-6bda4.firebaseapp.com",
  databaseURL: "https://knockknock-6bda4.firebaseio.com",
  projectId: "knockknock-6bda4",
  storageBucket: "knockknock-6bda4.appspot.com",
  messagingSenderId: "497929266276",
  appId: "1:497929266276:web:82f12b06379d6ee288eb71",
  measurementId: "G-QGMV8EPV59",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://knockknock-6bda4.firebaseio.com",
});
firebase.initializeApp(firebaseConfig);
const db = admin.firestore();

app.get("/knocks", (req, res) => {
  db.collection("knock")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let knock = [];
      data.forEach((data) => {
        knock.push({
          body: data.data().body,
          createdAt: data.data().createdAt,
          userHandle: data.data().userHandle,
        });
      });
      return res.json(knock);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/knock", (req, res) => {
  const newKnock = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(),
  };
  db.collection("knock")
    .add(newKnock)
    .then((data) => {
      return res.json({ message: `document ${data.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

app.post("/signup", (req, res) => {
  let tokenId, userId;
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(() => {
      return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((token) => {
      tokenId = token;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ tokenId });
    })
    .catch((err) => {
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ message: `${newUser.email} is taken` });
      } else {
        return res.status(500).json({ message: err.code });
      }
    });
});

exports.api = functions.region("us-central1").https.onRequest(app);
