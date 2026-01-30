import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Id: { 
      type: String, 
      required: true, 
      unique: true, 
      immutable: true 
    }, 
    name: { 
      type: String, 
      required: true, 
      trim: true, 
    },
    nickname: { 
      type: String, 
      trim: true, 
      unique: true, 
      sparse: true 
    },
    email: { 
      type: String, 
      unique: true, 
      lowercase: true, 
      sparse: true, 
      index: true 
    },
    avatar: { type: String, default: "" },
    coverImg: { type: String, default: "" }, 
    bio: { type: String, maxlength: 160 }, 
    location: { type: String, default: "" },
    workplace: { type: String, default: "" },
    
    // 🏆 CREATOR & VERIFICATION
    isVerified: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: false }, 
    isPremium: { type: Boolean, default: false }, 
    creatorLevel: { type: Number, default: 1 }, 

    // 🚀 STEP 10: VIRAL GROWTH & RANKING
    inviteCode: { 
      type: String, 
      unique: true, 
      sparse: true 
    }, 
    referredBy: { 
      type: String, 
      default: null,
      index: true 
    }, 
    inviteCount: { 
      type: Number, 
      default: 0 
    }, 
    isGenesisMember: { 
      type: Boolean, 
      default: false 
    }, 
// User Schema তে যোগ করুন
neuralRank: { type: Number, default: 0 },
drifterLevel: { 
  type: String, 
  enum: ["Novice Drifter", "Signal Voyager", "Time Architect", "Neural Overlord"],
  default: "Novice Drifter"
}
    neuralRank: { 
      type: String, 
      enum: ["Neophyte", "Voyager", "Zenith", "Overlord"], 
      default: "Neophyte" 
    }, 

    // 💰 REVENUE & ANALYTICS
    revenueWallet: { type: Number, default: 0 }, 
    totalImpressions: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },

    // 🛡 NEURAL & PRIVACY
    ghostMode: { type: Boolean, default: false },
    antiScreenshot: { type: Boolean, default: false },
    neuralShieldActive: { type: Boolean, default: true },
    
    activeNodes: [
      {
        deviceId: String,
        deviceName: String,
        location: String,
        lastActive: { type: Date, default: Date.now }
      }
    ],

    // 📡 CONNECTIONS
    followers: [{ type: String, index: true }], 
    following: [{ type: String, index: true }],
    friends: [{ type: String }],
    blockedUsers: [{ type: String }], 
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

/* ==========================================================
    🚀 OPTIMIZED INDEXING (Search & Ranking)
========================================================== */

// ১. গ্লোবাল সার্চ ফাস্ট করার জন্য টেক্সট ইনডেক্স (Weights সহ যাতে নামকে বেশি গুরুত্ব দেয়)
userSchema.index(
  { name: 'text', nickname: 'text', bio: 'text' },
  { weights: { name: 10, nickname: 5, bio: 1 }, name: "UserSearchIndex" }
);

// ২. ভাইরাল রিচ এবং ইনভাইট সিস্টেম ফাস্ট করার জন্য ইনডেক্স
userSchema.index({ createdAt: -1, isVerified: -1 });
userSchema.index({ inviteCode: 1 });
userSchema.index({ inviteCount: -1 }); 

const User = mongoose.model("User", userSchema);
export default User;