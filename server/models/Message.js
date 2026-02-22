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
      default: "Unknown Drifter" 
    },
    senderAvatar: { 
      type: String,
      default: ""
    },

    // ৩. ইউনিক আইডেন্টিফায়ার (Client-side tracking এর জন্য)
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

    // ৬. PRIVACY & SELF-DESTRUCT (Episodic Memory)
    isSelfDestruct: {
      type: Boolean,
      default: false
    },
    expireAt: {
      type: Date,
      default: null,
      index: true // TTL ইনডেক্সের জন্য জরুরি
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

// ১. TTL ইনডেক্স: এটি ডাটাবেস থেকে অটোমেটিক মেসেজ ডিলিট করবে
// expireAfterSeconds: 0 মানে হলো expireAt এ যে সময় দেওয়া আছে ঠিক সেই মুহূর্তেই ডিলিট হবে।
MessageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// ২. কম্পাউন্ড ইনডেক্স: চ্যাট লোডিং স্পিড বাড়ানোর জন্য
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// ৩. ভার্চুয়াল ফিল্ড: চ্যাট লকিং চেক
MessageSchema.virtual('isLocked').get(function() {
  if (!this.deliverAt) return false;
  return new Date() < this.deliverAt;
});

// ৪. প্রি-সেভ হুক: লজিক ভ্যালিডেশন
MessageSchema.pre('save', function(next) {
  // যদি self-destruct অন থাকে কিন্তু expireAt না থাকে, তবে ডিফল্ট ৩০ সেকেন্ড সেট হবে
  if (this.isSelfDestruct && !this.expireAt) {
    this.expireAt = new Date(Date.now() + 30 * 1000); 
  }

  // যদি deliverAt বর্তমান সময়ের পরের হয়, তবে অটোমেটিক টাইম ক্যাপসুল ট্রু হবে
  if (this.deliverAt && this.deliverAt > new Date()) {
    this.isTimeCapsule = true;
  }
  
  next();
});

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;