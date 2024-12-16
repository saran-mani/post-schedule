const Bull = require("bull");
const axios = require("axios");
const ScheduledPost = require("../models/ScheduledPost");
require("dotenv").config();
const postQueue = new Bull("postQueue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
  },
});

const AZURE_ACCESS_TOKEN = process.env.AZURE_ACCESS_TOKEN;
const AZURE_IG_USER_ID = process.env.AZURE_IG_USER_ID;

postQueue.process(async (job) => {
  const { postId } = job.data;

  try {
    const post = await ScheduledPost.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    console.log("Publishing scheduled post:", post);

    const mediaResponse = await axios.post(
      `https://graph.instagram.com/v21.0/${AZURE_IG_USER_ID}/media`,
      {
        image_url: post.imageUrl,
        caption: post.caption,
        access_token: AZURE_ACCESS_TOKEN,
      }
    );

    const containerId = mediaResponse.data.id;

    await axios.post(
      `https://graph.instagram.com/v21.0/${AZURE_IG_USER_ID}/media_publish`,
      {
        creation_id: containerId,
        access_token: AZURE_ACCESS_TOKEN,
      }
    );

    await ScheduledPost.findByIdAndUpdate(postId, { status: "Published" });
    console.log("Post successfully published!");
  } catch (error) {
    console.error("Failed to publish post:", error);
    await ScheduledPost.findByIdAndUpdate(postId, { status: "Failed" });
  }
});

module.exports = postQueue;
