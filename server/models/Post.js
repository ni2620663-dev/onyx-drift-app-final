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
      // 🔥 'story' যোগ করা হয়েছে যাতে স্টোরি আপলোড করার সময় ৫০০ এরর না আসে
      enum: ['image', 'video', 'reel', 'story', 'text', 'none'], 
      default: 'none' 
    },
    
    likes: [{ type: String }], 
    
    comments: [
      {
        userId: { type: String }, // কন্ট্রোলারের সাথে মিল রাখার জন্য userId করা হয়েছে
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