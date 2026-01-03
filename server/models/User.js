import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Auth0 থেকে আসা ইউনিক আইডি (sub)
    auth0Id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    workplace: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    
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

    // আইডিগুলো String হিসেবে সেভ হবে কারণ Auth0 আইডি ObjectId নয়
    followers: [{ type: String }], 
    following: [{ type: String }],
    friends: [{ type: String }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;