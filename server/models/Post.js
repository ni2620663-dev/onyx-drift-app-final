import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { 
      type: String, 
      required: true, 
      index: true 
    }, 
    
    authorAuth0Id: { 
      type: String, 
      required: true, 
      index: true 
    }, 

    authorName: { type: String, default: "Drifter" },
    authorAvatar: { type: String, default: "" },
    text: { type: String, trim: true }, 
    
    media: { type: String, default: "" }, 
    
    mediaType: { 
      type: String, 
      // 🔥 'story' এবং 'reel' নিশ্চিত করা হয়েছে
      enum: ['image', 'video', 'reel', 'story', 'text', 'none'], 
      default: 'none' 
    },
    
    likes: [{ type: String }], 

    // ⚡ RANK UP SYSTEM FIELD
    // এখানে ১০ জন ইউজারের ID জমা হলে ক্রিয়েটরের র‍্যাঙ্ক বাড়বে
    rankClicks: [{ type: String }], 
    
    comments: [
      {
        userId: { type: String }, 
        userName: { type: String },
        userAvatar: { type: String },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    
    views: { type: Number, default: 0 }
  },
  { 
    timestamps: true 
  }
);

postSchema.index({ authorAuth0Id: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;