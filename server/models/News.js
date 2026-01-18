// models/News.js
import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  link: String,
  source: String,
  publishedAt: Date,
}, { timestamps: true });

export default mongoose.model("News", newsSchema);
