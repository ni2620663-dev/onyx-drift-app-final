import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // ১. কন্টিনজেন্সি: এটি ওয়ান-টু-ওয়ান চ্যাট নাকি গ্রুপ/কমিউনিটি চ্যাট?
    conversationId: {
      type: String, // ওয়ান-টু-ওয়ান বা গ্রুপ চ্যাটের মূল আইডি
      index: true,
      required: true
    },
    isGroup: {
      type: Boolean,
      default: false
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      default: null,
      index: true
    },

    // ২. সেন্ডার ডিটেইলস (Fast UI Rendering)
    senderId: {
      type: String, // Auth0 ID
      required: true,
      index: true
    },
    senderName: { 
      type: String,
      required: true 
    },
    senderAvatar: { 
      type: String 
    },

    // ৩. ইউনিক আইডেন্টিফায়ার
    tempId: { 
      type: String, 
      unique: true, 
      sparse: true  
    },

    // ৪. কন্টেন্ট টাইপস
    text: {
      type: String,
      trim: true,
      default: ""
    },
    media: {
      type: String, 
      default: ""
    },
    mediaType: {
      type: String,
      enum: ["text", "image", "video", "voice", "file"],
      default: "text"
    },

    // ৫. স্ট্যাটাস এবং মেটাডাটা
    seenBy: [
      {
        userId: String,
        seenAt: { type: Date, default: Date.now }
      }
    ],
    isEdited: {
      type: Boolean,
      default: false
    },

    // 🚀 PHASE-10: SELF-DESTRUCT & PRIVACY
    isSelfDestruct: {
      type: Boolean,
      default: false
    },
    // এই ফিল্ডটি সেট করা থাকলে MongoDB স্বয়ংক্রিয়ভাবে মেসেজ ডিলিট করবে
    expireAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { 
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ==========================================================
    🚀 PERFORMANCE & PRIVACY OPTIMIZATION (Indexing)
========================================================== */

// ১. TTL ইনডেক্স: expireAt-এ দেওয়া সময় পার হওয়ামাত্রই ডিলিট হবে
// (expireAfterSeconds: 0 মানে একদম ওই নির্দিষ্ট সময়েই ডিলিট হবে)
MessageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// ২. চ্যাট হিস্ট্রি দ্রুত লোড করার জন্য কম্পাউন্ড ইনডেক্সিং
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ communityId: 1, createdAt: -1 });

// মডেল এক্সপোর্ট
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;