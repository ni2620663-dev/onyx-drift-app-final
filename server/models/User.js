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
    
    isVerified: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: false }, 
    isPremium: { type: Boolean, default: false }, 
    creatorLevel: { type: Number, default: 1 }, 

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

    neuralRank: { 
      type: Number, 
      default: 0 
    },
    drifterLevel: { 
      type: String, 
      enum: ["Novice Drifter", "Signal Voyager", "Time Architect", "Neural Overlord"],
      default: "Novice Drifter"
    },

    revenueWallet: { type: Number, default: 0 }, 
    totalImpressions: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },

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

    followers: [{ type: String, index: true }], 
    following: [{ type: String, index: true }],
    friends: [{ type: String }],
    blockedUsers: [{ type: String }], 
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

/* ==========================================================
    🚀 OPTIMIZED INDEXING (The 500 Error Fix)
========================================================== */

// ১. টেক্সট ইনডেক্স এর বদলে সাধারণ কম্পাউন্ড ইনডেক্স (Regex সার্চের জন্য নিরাপদ)
userSchema.index({ name: 1, nickname: 1 });

// ২. র‍্যাঙ্কিং এবং ভাইরাল গ্রোথ ইনডেক্স
userSchema.index({ createdAt: -1, isVerified: -1 });
userSchema.index({ inviteCount: -1 }); 

const User = mongoose.model("User", userSchema);
export default User;