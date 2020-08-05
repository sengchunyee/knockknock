const db = require("../util/admin");

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

exports.newPost = (req, res) => {
  const newKnock = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
  };
  db.collection("knock")
    .add(newKnock)
    .then((data) => {
      return res.json({ message: `document ${data.id} created successfully` });
    })
    .catch((err) => {
      return res.json(400).json(err);
    });
};
