// routes/news.js
import express from "express";
import News from "../models/News.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const news = await News.find().sort({ publishedAt: -1 }).limit(100);
  res.json(news);
});

export default router;
