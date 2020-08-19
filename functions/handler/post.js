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
  const newPost = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };
  db.collection("knock")
    .add(newPost)
    .then((data) => {
      const resPost = newPost;
      resPost.postId = data.id;
      return res.json(resPost);
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
        return res.status(404).json({ error: "Post not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
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

//like a post
exports.likePost = (req, res) => {
  const likeDocu = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("postId", "==", req.params.postId)
    .limit(1);
  const postDocu = db.doc(`/knock/${req.params.postId}`);

  let postData;
  postDocu
    .get()
    .then((doc) => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return likeDocu.get();
      } else {
        return res.status(400).json({ error: "Post not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            postId: req.params.postId,
            userHandle: req.user.handle,
          })
          .then(() => {
            postData.likeCount++;
            return postDocu.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            return res.json(postData);
          });
      } else {
        return res.status(400).json({ error: "Post already liked" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err: err });
    });
};

//unlike a post
exports.unlikePost = (req, res) => {
  const unlikeDocu = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("postId", "==", req.params.postId)
    .limit(1);
  const postDocu = db.doc(`/knock/${req.params.postId}`);

  let postData;
  postDocu
    .get()
    .then((doc) => {
      if (doc.exists) {
        postData = doc.data();
        postData.postId = doc.id;
        return unlikeDocu.get();
      } else {
        return res.status(400).json({ error: "Post not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Already not liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            postData.likeCount--;
            return postDocu.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            return res.json(postData);
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ err: err });
    });
};

//delete post
exports.deletePost = (req, res) => {
  const document = db.doc(`/knock/${req.params.postId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized to perform" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      return res.status(200).json({ message: "Post Deleted" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ err: err });
    });
};
