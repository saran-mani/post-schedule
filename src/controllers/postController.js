const multer = require("multer");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const moment = require("moment-timezone");
const ScheduledPost = require("../models/ScheduledPost");
const postQueue = require("../queue/postQueue");
const path = require("path");
require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

const containerName = process.env.AZURE_CONTAINER_NAME;
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const blobServiceClient = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net`,
  new StorageSharedKeyCredential(storageAccountName, storageAccountKey)
);

const uploadImageToAzure = async (fileBuffer, fileName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const uniqueFileName = `${Date.now()}${path.extname(fileName)}`;
  const blobClient = containerClient.getBlockBlobClient(uniqueFileName);

  await blobClient.upload(fileBuffer, fileBuffer.length);

  const blobUrl = blobClient.url;

  return blobUrl;
};

exports.schedulePost = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: "Error in image upload." });
      }

      const { caption, publishDateTime } = req.body;

      if (!req.file || !publishDateTime) {
        return res
          .status(400)
          .json({ error: "Image and publish date/time are required." });
      }

      const imageUrl = await uploadImageToAzure(
        req.file.buffer,
        req.file.originalname
      );

      const publishTime = moment.tz(publishDateTime, "Asia/Kolkata");
      if (publishTime.isBefore(moment())) {
        return res
          .status(400)
          .json({ error: "Publish date/time must be in the future." });
      }

      const newPost = new ScheduledPost({
        imageUrl,
        caption,
        publishTime: publishTime.toDate(),
      });

      await newPost.save();

      await postQueue.add(
        { postId: newPost._id },
        { delay: publishTime.diff(moment(), "milliseconds") }
      );

      res
        .status(200)
        .json({ message: "Post successfully scheduled.", newPost });
    });
  } catch (error) {
    console.error("Error in schedulePost:", error);
    res
      .status(500)
      .json({ error: "An error occurred while scheduling the post." });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const posts = await ScheduledPost.find();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getScheduledPosts:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the posts." });
  }
};
