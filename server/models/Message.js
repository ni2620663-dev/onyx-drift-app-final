import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // ১. কন্টিনজেন্সি: চ্যাট টাইপ আইডেন্টিফিকেশন
    conversationId: {
      type: String, 
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

    // ২. সেন্ডার ডিটেইলস (Neural Identity)
    senderId: {
      type: String, 
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

    // ৪. কন্টেন্ট এবং মিডিয়াম
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
      enum: ["text", "image", "video", "voice", "file", "neural-thought"],
      default: "text"
    },

    // 🚀 ফিচার ১: EMOTIONAL SIGNATURE (ইমোশন ট্র্যাকিং যা ১০০ বছর পর কাজে লাগবে)
    // এটি ইউজারের মুড এনকোড করবে
    neuralMood: {
      type: String,
      enum: ["Neutral", "Happy", "Sad", "Enraged", "Ecstatic", "Anxious", "Neural-Flow"],
      default: "Neural-Flow"
    },

    // 🚀 ফিচার ২: THE TIME CAPSULE (আগামী ১০০ বছরের জন্য মেসেজ লক)
    isTimeCapsule: {
      type: Boolean,
      default: false
    },
    deliverAt: {
      type: Date,
      default: Date.now,
      index: true // ফিউচার মেসেজগুলো খুঁজে বের করার জন্য
    },

    // 🚀 ফিচার ৩: DIGITAL LEGACY (মৃত্যুর পরও অস্তিত্ব বজায় রাখা)
    isLegacyMessage: {
      type: Boolean,
      default: false
    },
    autonomousReplyEnabled: {
      type: Boolean,
      default: false // ভবিষ্যতে AI যেন আপনার হয়ে উত্তর দিতে পারে তার পারমিশন
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

    // ৬. PRIVACY & SELF-DESTRUCT
    isSelfDestruct: {
      type: Boolean,
      default: false
    },
    // TTL ইনডেক্সিং এর জন্য ব্যবহৃত হবে
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
    📡 PERFORMANCE & QUANTUM OPTIMIZATION
========================================================== */

// ১. TTL ইনডেক্স: নির্দিষ্ট সময়ে অটোমেটিক ডিলিট করার জন্য
MessageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// ২. টাইম ক্যাপসুল ইনডেক্সিং: যাতে ফিউচার মেসেজগুলো দ্রুত প্রসেস হয়
MessageSchema.index({ deliverAt: 1 });

// ৩. চ্যাট হিস্ট্রি দ্রুত লোড করার জন্য কম্পাউন্ড ইনডেক্সিং
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ communityId: 1, createdAt: -1 });

// ৪. ভার্চুয়াল ফিল্ড: মেসেজটি কি বর্তমানে 'লকড' অবস্থায় আছে?
MessageSchema.virtual('isLocked').get(function() {
  return this.isTimeCapsule && new Date() < this.deliverAt;
});

// মডেল এক্সপোর্ট
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;