import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: String,
    userAvatar: String,
    content: { type: String, required: true },
    image: String,
    likes: { type: Array, default: [] },
    comments: [
        {
            userId: String,
            userName: String,
            text: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model("Post", PostSchema);