import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  content: { type: String, required: true },
  image: { type: String },
  likes: { type: [String], default: [] }, 
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