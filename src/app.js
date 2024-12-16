const express = require("express");
const mongoose = require("mongoose");
const postRoutes = require("./routes/postRoutes");

const app = express();
require("dotenv").config();

app.use(express.json());

mongoose.connect("mongodb://localhost:27017/grafixui");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.use("/api/v1/schedule-post", postRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
