import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Id: { 
      type: String, 
      required: true, 
      unique: true, 
      // index: true এখানে দরকার নেই, কারণ unique: true অটোমেটিক ইনডেক্স তৈরি করে
      immutable: true 
    }, 
    
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      immutable: true 
    },
    
    nickname: { type: String, trim: true, unique: true, sparse: true }, 
    
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

// ১. টেক্সট ইনডেক্স (সার্চ ইঞ্জিন আরও শক্তিশালী করার জন্য)
userSchema.index({ name: 'text', nickname: 'text' });

// ২. কম্পাউন্ড ইনডেক্স (সার্চ রেজাল্টে ভেরিফাইড ইউজারদের প্রায়োরিটি দিতে)
userSchema.index({ name: 1, isVerified: -1 });

// ৩. সার্চ লজিকের জন্য nickname ইনডেক্স (যদি nickname দিয়ে সার্চ করেন)
userSchema.index({ nickname: 1 });

const User = mongoose.model("User", userSchema);
export default User;