import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  content: { type: String, required: true },
  image: { type: String },
  // লাইক যারা দিয়েছে তাদের ID থাকবে এই অ্যারেতে
  likes: { type: [String], default: [] }, 
  // কমেন্টগুলো অবজেক্ট হিসেবে থাকবে
  comments: [
    {
      userId: String,
      userName: String,
      userAvatar: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", postSchema);
export default Post;