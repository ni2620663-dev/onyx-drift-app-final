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
      enum: ['image', 'video', 'reel', 'story', 'text', 'none'], 
      default: 'none' 
    },
    
    // ❤️ Like system with default empty array
    likes: { 
      type: [String], 
      default: [] 
    }, 

    // ⚡ RANK UP SYSTEM FIELD (Fixed with Default)
    // এখানে ১০ জন ইউজারের ID জমা হলে ক্রিয়েটরের র‍্যাঙ্ক বাড়বে
    rankClicks: { 
      type: [String], 
      default: [] 
    }, 
    
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

/* ==========================================================
    🚀 OPTIMIZED INDEXING
========================================================== */
postSchema.index({ authorAuth0Id: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
// র‍্যাঙ্ক ক্লিক কাউন্ট দিয়ে কোয়েরি ফাস্ট করার জন্য ইনডেক্স
postSchema.index({ rankClicks: 1 }); 

const Post = mongoose.model('Post', postSchema);
export default Post;