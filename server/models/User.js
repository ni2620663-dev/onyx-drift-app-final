import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* ==========================================================
        ১. DIGITAL IDENTITY & AUTH
    ========================================================== */
    auth0Id: { 
      type: String, 
      required: true, 
      unique: true, 
      immutable: true 
    }, 
    name: { 
      type: String, 
      required: true, 
      trim: true, 
    },
    nickname: { 
      type: String, 
      trim: true, 
      unique: true, 
      sparse: true 
    },
    email: { 
      type: String, 
      unique: true, 
      lowercase: true, 
      sparse: true, 
      index: true 
    },
    avatar: { type: String, default: "" },
    aiTwinAvatar: { type: String, default: "" }, 
    aiPersona: { type: String, default: "Neural Drifter" }, 
    coverImg: { type: String, default: "" }, 
    bio: { type: String, default: "System Drifter // Neural Integrity: High", maxlength: 160 }, 
    location: { type: String, default: "" },
    workplace: { type: String, default: "" },
    aiAutopilot: { 
      type: Boolean, 
      default: true 
    },
    aiTone: { 
      type: Number, 
      default: 50 
    }, 
    ghostMode: { 
      type: Boolean, 
      default: false 
    },

    /* ==========================================================
        ২. EMOTION TIMELINE & MOOD STATS
    ========================================================== */
    moodStats: {
      motivated: { type: Number, default: 40 },
      creative: { type: Number, default: 30 },
      calm: { type: Number, default: 20 },
      stressed: { type: Number, default: 10 }
    },
    moodHistory: [
      {
        mood: String,
        intensity: Number,
        timestamp: { type: Date, default: Date.now }
      }
    ],

    /* ==========================================================
        ৩. IMPACT, CONTRIBUTION & RANKING
    ========================================================== */
    neuralImpact: { type: Number, default: 0 }, 
    decisionsInfluenced: { type: Number, default: 0 }, 
    neuralRank: { type: Number, default: 1 },
    drifterLevel: { 
      type: String, 
      enum: ["Novice Drifter", "Signal Voyager", "Time Architect", "Neural Overlord"],
      default: "Novice Drifter"
    },
    influence: { type: Number, default: 0 },
    syncRate: { type: Number, default: 85 },
    isVerified: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: false }, 
    isPremium: { type: Boolean, default: false }, 
    creatorLevel: { type: Number, default: 1 }, 
    achievements: [{ type: String }],

    /* ==========================================================
        ৪. SKILLS / INTERESTS (AI Detected)
    ========================================================== */
    detectedSkills: [{
      name: String, 
      relevance: Number,
      icon: String
    }],

    /* ==========================================================
        ৫. NEURAL DEATH-SWITCH & LEGACY (The "Vayankar" Feature)
    ========================================================== */
    deathSwitch: {
      isActive: { type: Boolean, default: false },
      inactivityThresholdMonths: { type: Number, default: 12 }, // ১ থেকে ২৪ মাস পর্যন্ত
      lastPulseTimestamp: { type: Date, default: Date.now }, // শেষ অ্যাক্টিভিটি চেক
      isTriggered: { type: Boolean, default: false } // ইউজার কি ডিজিটালি মৃত?
    },
    legacyProtocol: {
      inheritorNeuralId: { type: String, default: null }, // মনোনীত উত্তরাধিকারীর আইডি
      recoveryKeyHash: { type: String, default: null }, // সিকিউর কি হ্যাশ
      vaultStatus: { 
        type: String, 
        enum: ["AWAITING_SEAL", "SEALED", "RELEASED"], 
        default: "AWAITING_SEAL" 
      },
      inheritanceDate: { type: Date } // কবে ভল্ট রিলিজ হলো
    },

    /* ==========================================================
        ৬. MEMORY VAULT 
    ========================================================== */
    memoryVaultCount: { type: Number, default: 0 },
    memoryVault: [
      {
        content: String,
        media: String,
        emotionVector: [Number], // AI যাতে মুড বুঝতে পারে
        unlockDate: Date,
        isPrivate: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    /* ==========================================================
        ৭. GROWTH & INVITE SYSTEM
    ========================================================== */
    inviteCode: { 
      type: String, 
      unique: true, 
      sparse: true 
    }, 
    referredBy: { 
      type: String, 
      default: null,
      index: true 
    }, 
    inviteCount: { 
      type: Number, 
      default: 0 
    }, 
    isGenesisMember: { 
      type: Boolean, 
      default: false 
    }, 

    /* ==========================================================
        ৮. MONETIZATION, SECURITY & NODES
    ========================================================== */
    revenueWallet: { type: Number, default: 0 }, 
    totalImpressions: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
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

    /* ==========================================================
        ৯. SOCIAL GRAPH
    ========================================================== */
    followers: [{ type: String, index: true }], 
    following: [{ type: String, index: true }],
    friends: [{ type: String }],
    blockedUsers: [{ type: String }], 
    pendingRequests: [{ type: String }], 
  },
  { timestamps: true }
);

/* ==========================================================
    🚀 OPTIMIZED INDEXING
========================================================== */
userSchema.index({ name: 1, nickname: 1 });
userSchema.index({ createdAt: -1, isVerified: -1 });
userSchema.index({ inviteCount: -1 }); 
userSchema.index({ neuralImpact: -1 });
userSchema.index({ "deathSwitch.lastPulseTimestamp": 1 }); // ক্রন জবের পারফরম্যান্সের জন্য

const User = mongoose.model("User", userSchema);
export default User;