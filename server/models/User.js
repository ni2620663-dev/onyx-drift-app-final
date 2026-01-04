import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Auth0 থেকে আসা ইউনিক আইডি (sub)
    auth0Id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    
    // --- Photos (এখন কভার ইমেজ সেভ হবে) ---
    avatar: { type: String, default: "" },
    coverImg: { type: String, default: "" }, // এই ফিল্ডটি আগে ছিল না
    
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    workplace: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false }, // প্রোফাইলে ব্যাজ দেখানোর জন্য
    
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
    // এটি যোগ করা হলো যাতে রিকোয়েস্টগুলো সেভ হতে পারে (আপনার রাউট অনুযায়ী)
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;