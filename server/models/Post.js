import mongoose from 'mongoose';

/* ==========================================================
    🚀 ONYX DRIFT - OPTIMIZED POST SCHEMA
========================================================== */

const postSchema = new mongoose.Schema(
  {
    // Auth0 Sub ID (Primary identifier for the author)
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
    text: { type: String, trim: true, required: true }, 
    
    media: { type: String, default: "" }, 
    
    mediaType: { 
      type: String, 
      enum: ['image', 'video', 'reel', 'story', 'text', 'none'], 
      default: 'none' 
    },
    
    /* ==========================================================
        🎥 PRO EDITOR & RENDERING METADATA
    ========================================================== */
    editMetadata: {
      filters: {
        brightness: { type: Number, default: 100 },
        contrast: { type: Number, default: 100 },
        saturate: { type: Number, default: 100 },
        hue: { type: Number, default: 0 },
        blur: { type: Number, default: 0 }
      },
      playbackSpeed: { type: Number, default: 1 },
      aspectRatio: { type: String, default: "9/16" },
      layers: [
        {
          id: String,
          type: { type: String, default: 'text' },
          content: String,
          x: Number,
          y: Number
        }
      ],
      renderType: { type: String, default: "FFMPEG_CLOUD" }
    },

    // ❤️ Like system (Energy) - String IDs stored in array
    likes: { 
      type: [String], 
      default: [] 
    }, 

    // ⚡ Energy/Rank system (Legacy mapping)
    energy: {
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
        userId: { type: String, required: true }, // Auth0 ID
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

// ডাইনামিক লাইক কাউন্ট পাওয়ার জন্য ভার্চুয়াল প্রোপার্টি
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// ইনডেক্সিং - পারফরম্যান্স বৃদ্ধির জন্য
postSchema.index({ authorAuth0Id: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isAiGenerated: 1, createdAt: -1 });
postSchema.index({ mediaType: 1 });

const Post = mongoose.model('Post', postSchema);
export default Post;