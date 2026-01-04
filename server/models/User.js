import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Auth0 থেকে আসা ইউনিক আইডি (sub)
    auth0Id: { type: String, required: true, unique: true },
    
    name: { type: String, required: true, trim: true },
    
    // sparse: true যোগ করা হয়েছে যাতে ইমেইল না থাকলে (null হলে) ডুপ্লিকেট এরর না দেয়
    email: { 
      type: String, 
      unique: true, 
      lowercase: true, 
      sparse: true, 
      required: false 
    },
    
    // --- Photos ---
    avatar: { type: String, default: "" },
    coverImg: { type: String, default: "" }, 
    
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    workplace: { type: String, default: "" },
    
    isVerified: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false }, 
    
    // --- Unique Security Features ---
    ghostMode: { type: Boolean, default: false },
    antiScreenshot: { type: Boolean, default: false },
    neuralShieldActive: { type: Boolean, default: true },
    
    // ডিভাইস ট্র্যাকিং লজিক
    activeNodes: [
      {
        deviceId: String,
        deviceName: String,
        location: String,
        lastActive: { type: Date, default: Date.now }
      }
    ],

    // আইডিগুলো String হিসেবে সেভ হবে
    followers: [{ type: String }], 
    following: [{ type: String }],
    friends: [{ type: String }],
    
    // ফ্রেন্ড রিকোয়েস্ট সেভ করার জন্য
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;