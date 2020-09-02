const { db, admin } = require("../util/admin");
const firebase = require("firebase");
const config = require("../util/config");
firebase.initializeApp(config);
const { v4: uuidv4 } = require("uuid");
const {
  validateSignUp,
  validateLogin,
  randomNameGenerate,
  reduceUserDetails,
} = require("../util/helper");

//signup routes
exports.signUp = (req, res) => {
  let tokenId, userId;
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };
  const { valid, errors } = validateSignUp(newUser);
  if (!valid) return res.status(400).json(errors);
  const noImage = "avatar.png";
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
    .then((tokenId) => {
      token = tokenId;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId,
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
      };
      return db.doc(`/users/${newUser.userId}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      return res.status(500).json(err);
    });
};

//login routes
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const { valid, errors } = validateLogin(user);
  if (!valid) return res.status(400).json(errors);
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      return res.status(400).json(err);
    });
};

//upload image
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fileSystem = require("fs");

  let imageFileName;
  let imageToBeUploaded = {};
  let uuid = uuidv4();
  const busboy = new BusBoy({ headers: req.headers });
  busboy.on("file", (fieldName, file, fileName, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({
        err: "Wrong file type.Please upload only jpeg or png format.",
      });
    }

    const imageExtension = fileName.split(".")[fileName.split(".").length - 1];
    imageFileName = `${randomNameGenerate()}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fileSystem.createWriteStream(filePath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            firebaseStorageDownloadTokens: uuid,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&&token=${uuid}`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image upload successfully" });
      })
      .catch((err) => {
        return res.json(400).json(err);
      });
  });
  busboy.end(req.rawBody);
};

//add user details
exports.addUserDetails = (req, res) => {
  const userDetails = reduceUserDetails(req.body);
  db.doc(`/users/${req.user.handle}`)
    // .get()
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details update successfully" });
    })
    .catch((err) => {
      return console.log(err);
    });
};

//get user details
exports.getProfile = (req, res) => {
  let userProfile = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userProfile.credentials = doc.data();
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
      return res.status(404).json({ error: "Not found" });
    })
    .then((data) => {
      userProfile.likes = [];
      data.forEach((doc) => {
        userProfile.likes.push(doc.data());
      });
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .get();
    })
    .then((data) => {
      console.log("data=", data);
      userProfile.notifications = [];
      data.forEach((doc) => {
        userProfile.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          postId: doc.data().postId,
          notificationsId: doc.id,
          type: doc.data().type,
          read: doc.data().read,
        });
      });
      return res.json(userProfile);
    })
    .catch((err) => {
      return res.status(500).json(err);
    });
};

//get other user profile
exports.getOtherUserProfile = (req, res) => {
  let userProfile = {};
  db.doc(`users/${req.params.handle}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Profile not found" });
      } else {
        userProfile.user = doc.data();
        return db
          .collection("knock")
          .where("userHandle", "==", req.params.handle)
          .orderBy("createdAt", "desc")
          .get();
      }
    })
    .then((data) => {
      userProfile.post = [];
      data.forEach((doc) => {
        userProfile.post.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          postId: doc.data().postId,
        });
      });
      return res.json(userProfile);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err });
    });
};

//mark read notifications
exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationsId) => {
    const notification = db.doc(`/notifications/${notificationsId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Notifications read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(400).json({ err: err });
    });
};
