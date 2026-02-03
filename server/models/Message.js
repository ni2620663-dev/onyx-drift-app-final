import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // ১. কন্টিনজেন্সি: চ্যাট টাইপ আইডেন্টিফিকেশন
    conversationId: {
      type: String, 
      index: true,
      required: [true, "Conversation ID is required"]
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
      required: [true, "Sender ID is required"],
      index: true
    },
    senderName: { 
      type: String,
      required: [true, "Sender Name is required"],
      default: "Unknown Drifter" 
    },
    senderAvatar: { 
      type: String,
      default: ""
    },

    // ৩. ইউনিক আইডেন্টিফায়ার (অপ্রয়োজনীয় এরর এড়াতে sparse রাখা হয়েছে)
    tempId: { 
      type: String, 
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

    // 🚀 ফিচার ১: EMOTIONAL SIGNATURE
    // ফ্রন্টএন্ডের 'Neural-Flow' এবং অন্যান্য মুড এখানে এলাউ করা হয়েছে
    neuralMood: {
      type: String,
      enum: ["Neutral", "Happy", "Sad", "Enraged", "Ecstatic", "Anxious", "Neural-Flow"],
      default: "Neural-Flow"
    },

    // 🚀 ফিচার ২: THE TIME CAPSULE
    isTimeCapsule: {
      type: Boolean,
      default: false
    },
    deliverAt: {
      type: Date,
      default: Date.now,
      index: true 
    },

    // 🚀 ফিচার ৩: DIGITAL LEGACY
    isLegacyMessage: {
      type: Boolean,
      default: false
    },
    autonomousReplyEnabled: {
      type: Boolean,
      default: false 
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

// ১. TTL ইনডেক্স: expireAt ফিল্ডে ভ্যালু থাকলে অটো ডিলিট হবে
MessageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// ২. চ্যাট হিস্ট্রি দ্রুত লোড করার জন্য কম্পাউন্ড ইনডেক্সিং
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// ৩. ভার্চুয়াল ফিল্ড: মেসেজটি কি বর্তমানে 'লকড' (টাইম ক্যাপসুল) অবস্থায় আছে?
MessageSchema.virtual('isLocked').get(function() {
  return this.isTimeCapsule && new Date() < this.deliverAt;
});

// মডেল এক্সপোর্ট
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;