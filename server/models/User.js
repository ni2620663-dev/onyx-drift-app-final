import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, unique: true, index: true }, 
    name: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true, unique: true, sparse: true }, // Nickname unique হওয়া ভালো
    email: { 
      type: String, 
      unique: true, 
      lowercase: true, 
      sparse: true, 
      index: true 
    },
    avatar: { type: String, default: "" },
    coverImg: { type: String, default: "" }, 
    bio: { type: String, max: 160 }, // লেন্থ লিমিট করা মেমোরি বাঁচায়
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

    /**
     * স্কেলিং টিপ: ১০০ মিলিয়ন ইউজারের ক্ষেত্রে followers/following অ্যারে 
     * যদি খুব বড় হয় (যেমন ১০,০০০+ ফলোয়ার), তবে সেটি 'Document Size Limit' (16MB) ক্রস করতে পারে।
     * আপাতত আপনার ইনডেক্স ঠিক আছে, তবে ভবিষ্যতে একে আলাদা কালেকশনে নেওয়া বুদ্ধিমানের কাজ হবে।
     */
    followers: [{ type: String }], 
    following: [{ type: String }],
    friends: [{ type: String }],
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

// --- CRITICAL INDEXING FOR 100M USERS ---

// ১. টেক্সট ইনডেক্স (গ্লোবাল সার্চের জন্য)
userSchema.index({ name: 'text', nickname: 'text' });

// ২. কম্পাউন্ড ইনডেক্স (ফিল্টারিং এবং সর্টিং ফাস্ট করার জন্য)
userSchema.index({ name: 1, isVerified: -1 });

// ৩. ফলোয়ার্স সার্চ করার জন্য ইনডেক্স
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

const User = mongoose.model("User", userSchema);
export default User;