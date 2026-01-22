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

    // ২. সেন্ডার ডিটেইলস (Fast UI Rendering - যাতে বারবার ইউজার টেবিল পপুলেট করতে না হয়)
    senderId: {
      type: String, // Auth0 ID (e.g., auth0|123...)
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

    // ৩. ইউনিক আইডেন্টিফায়ার (Optimistic UI & Duplicate Prevention)
    tempId: { 
      type: String, 
      unique: true, // এটি সার্ভারে ডুপ্লিকেট মেসেজ সেভ হওয়া আটকাবে
      sparse: true  
    },

    // ৪. কন্টেন্ট টাইপস (Photo, Video, Voice Support)
    text: {
      type: String,
      trim: true,
      default: ""
    },
    media: {
      type: String, // Cloudinary বা ফাইল URL
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
    }
  },
  { 
    timestamps: true, // এটি স্বয়ংক্রিয়ভাবে createdAt এবং updatedAt তৈরি করবে
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ==========================================================
    🚀 PERFORMANCE OPTIMIZATION (Indexing)
========================================================== */
// চ্যাট হিস্ট্রি দ্রুত লোড করার জন্য কম্পাউন্ড ইনডেক্সিং
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ communityId: 1, createdAt: -1 });

// মেমরি সেভ করার জন্য মডেল এক্সপোর্ট
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;