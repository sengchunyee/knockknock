const { db, admin } = require("../util/admin");
const firebase = require("firebase");
const config = require("../util/config");
firebase.initializeApp(config);
const { v4: uuidv4 } = require("uuid");
const {
  validateSignUp,
  validateLogin,
  randomNameGenerate,
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
  if (!valid) return res.status(400).json({ errors });
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
    .then((token) => {
      tokenId = token;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId,
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ tokenId });
    })
    .catch((err) => {
      return res.status(500).json({ err });
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
      return res.status(400).json({ err });
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
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
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
