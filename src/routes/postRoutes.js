const express = require("express");
const {
  schedulePost,
  getScheduledPosts,
} = require("../controllers/postController");

const router = express.Router();

router.route("/").post(schedulePost).get(getScheduledPosts);

module.exports = router;
