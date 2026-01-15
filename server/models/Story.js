import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  text: { type: String },
  musicName: { type: String },
  musicUrl: { type: String },
  filter: { type: String },
  // এটি true থাকলে স্টোরিটি শুধুমাত্র মেসেঞ্জারে সীমাবদ্ধ থাকবে
  onlyMessenger: { 
    type: String, 
    default: "true" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: { expires: '12h' } // ১২ ঘণ্টা পর অটো ডিলিট হয়ে যাবে
  }
});

// দ্রুত সার্চ করার জন্য ইনডেক্সিং
StorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Story", StorySchema);