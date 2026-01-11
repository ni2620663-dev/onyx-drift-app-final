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
      immutable: true 
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
    isPremium: { type: Boolean, default: false }, 
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
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

/* ==========================================================
    🚀 OPTIMIZED INDEXING
========================================================== */
// গ্লোবাল সার্চ ফাস্ট করার জন্য টেক্সট ইনডেক্স
userSchema.index({ name: 'text', nickname: 'text' });
// কম্পাউন্ড ইনডেক্স (ভেরিফাইড ইউজারদের আগে দেখানোর জন্য)
userSchema.index({ name: 1, isVerified: -1 });

const User = mongoose.model("User", userSchema);
export default User;