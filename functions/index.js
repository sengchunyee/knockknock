const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");

const express = require("express");
const app = express();

admin.initializeApp();

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

firebase.initializeApp(firebaseConfig);
app.get("/knocks", (req, res) => {
  admin
    .firestore()
    .collection("knock")
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
  admin
    .firestore()
    .collection("knock")
    .add(newKnock)
    .then((data) => {
      return res.json({ message: `document ${data.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

exports.api = functions.region("us-central1").https.onRequest(app);
