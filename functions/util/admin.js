const admin = require("firebase-admin");
// const serviceAccount = require("../../knockknock-6bda4-firebase-adminsdk-ixft2-37805485f7.json");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://knockknock-6bda4.firebaseio.com",
  storageBucket: "knockknock-6bda4.appspot.com",
});
const db = admin.firestore();
module.exports = { admin, db };
