const mongoose = require("mongoose");

const scheduledPostSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String },
  publishTime: { type: Date, required: true },
  status: { type: String, default: "Scheduled" },
});

const ScheduledPost = mongoose.model("ScheduledPost", scheduledPostSchema);

module.exports = ScheduledPost;
