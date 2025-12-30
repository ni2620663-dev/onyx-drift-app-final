import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  user: { type: String, default: "Anonymous" },
  likes: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Video", videoSchema);