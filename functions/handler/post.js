const { db } = require("../util/admin");

//retrieve all posts
exports.getAllPosts = (req, res) => {
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
      return res.status(400).json(err);
    });
};

//create new post
exports.newPost = (req, res) => {
  const newKnock = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
  };
  db.collection("knock")
    .add(newKnock)
    .then((data) => {
      return res.json({ message: `New Post ${data.id} created successfully` });
    })
    .catch((err) => {
      return res.json(400).json(err);
    });
};

//get data for specific post
exports.getPost = (req, res) => {
  let post = {};
  db.doc(`/knock/${req.params.postId}`)
    .get()
    .then((doc) => {
      if (!doc) {
        return res.status(404).json({ error: "Post not found" });
      }
      post = doc.data();
      post.id = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("postId", "==", req.params.postId)
        .get();
    })
    .then((data) => {
      post.comments = [];
      data.forEach((doc) => {
        post.comments.push(doc.data());
      });
      return res.json(post);
    })
    .catch((err) => {
      return res.status(500).json({ err });
    });
};

//comment on post
exports.commentPost = (req, res) => {
  if (req.body.body.trim().length === 0) {
    return res.status(400).json({ error: "Comment must not be empty." });
  }
  const newComment = {
    body: req.body.body.trim(),
    createdAt: new Date().toISOString(),
    postId: req.params.postId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };
  db.doc(`/knock/${req.params.postId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(400).json({ error: "Post not found" });
      }
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return res.status(200).json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
};
