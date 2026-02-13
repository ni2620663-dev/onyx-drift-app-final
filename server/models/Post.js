import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    // Auth0 Sub ID (Primary identifier)
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
    
    // ❤️ Like system - String IDs stored in array
    likes: { 
      type: [String], 
      default: [] 
    }, 

    // ⚡ RANK UP SYSTEM FIELD
    rankClicks: { 
      type: [String], 
      default: [] 
    }, 
    
    comments: [
      {
        userId: { type: String, required: true }, 
        userName: { type: String, default: "Ghost Drifter" },
        userAvatar: { type: String, default: "" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    
    views: { type: Number, default: 0 },

    /* ==========================================================
        🤖 AI AUTONOMOUS FIELDS
    ========================================================== */
    isAiGenerated: { 
      type: Boolean, 
      default: false,
      index: true
    }, 
    
    aiPersona: { 
      type: String, 
      default: "Neural Shadow" 
    }, 
    
    neuralSyncLevel: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100 
    },

    aiThoughtProcess: { 
      type: String 
    } 
  },
  { 
    timestamps: true 
  }
);

/* ==========================================================
    🚀 OPTIMIZED INDEXING & VIRTUALS
========================================================== */

// ১. ডাইনামিক লাইক কাউন্ট পাওয়ার জন্য ভার্চুয়াল প্রোপার্টি (ঐচ্ছিক)
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// ২. কম্পাউন্ড ইনডেক্স - যাতে প্রোফাইল এবং ফিড খুব ফাস্ট লোড হয়
postSchema.index({ authorAuth0Id: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isAiGenerated: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;