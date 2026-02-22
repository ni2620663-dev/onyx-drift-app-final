import express from "express";
const router = express.Router();
import { auth } from 'express-oauth2-jwt-bearer';

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      
import User from "../models/User.js";  

// 🛡️ JWT Middleware
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com',
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', 
  tokenSigningAlg: 'RS256'
});

/* ==========================================================
    🔍 SEARCH USERS
========================================================== */
router.get("/search-users/:query", checkJwt, async (req, res) => {
  try {
    const { query } = req.params;
    const currentUserId = req.auth?.payload?.sub; 

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Neural query too short" });
    }

    const users = await User.find({
      auth0Id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { nickname: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
    .limit(10)
    .select("name nickname email avatar auth0Id isVerified neuralRank")
    .lean(); 

    res.status(200).json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Failed to locate drifters" });
  }
});

/* ==========================================================
    1️⃣ GET ALL CONVERSATIONS
========================================================== */
router.get("/conversations", checkJwt, async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    // ১. মেম্বার হিসেবে যুক্ত সব কনভারসেশন খুঁজে বের করা
    const conversations = await Conversation.find({
      members: { $in: [currentUserId] },
    }).sort({ updatedAt: -1 }).lean();

    // ২. মেম্বার ডিটেইলস পপুলেট করা (যদি গ্রুপ না হয়)
    const detailedConversations = await Promise.all(
      conversations.map(async (conv) => {
        if (!conv.isGroup) {
          const otherMemberId = conv.members.find((id) => id !== currentUserId);
          const userDetails = await User.findOne({ auth0Id: otherMemberId })
            .select("name nickname email avatar auth0Id neuralRank")
            .lean();

          conv.userDetails = userDetails || { 
            name: "Unknown Drifter", 
            auth0Id: otherMemberId 
          };
        }
        return conv;
      })
    );

    res.status(200).json(detailedConversations);
  } catch (err) {
    console.error("Fetch Conv Error:", err);
    res.status(500).json({ error: "Could not sync conversations" });
  }
});

/* ==========================================================
    2️⃣ CREATE OR GET CONVERSATION
========================================================= */
router.post("/conversation", checkJwt, async (req, res) => {
  const { receiverId, isGroup, groupName, members } = req.body;
  const senderId = req.auth?.payload?.sub;

  try {
    if (isGroup) {
      const newGroup = new Conversation({
        members: [...new Set([...(members || []), senderId])], 
        isGroup: true,
        groupName: groupName || "Unnamed Nexus",
        admin: senderId
      });
      const savedGroup = await newGroup.save();
      return res.status(200).json(savedGroup);
    }

    if (!receiverId) return res.status(400).json({ error: "Receiver ID required" });

    // Single Chat Logic: চেক করা আগে থেকেই চ্যাট আছে কি না
    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [senderId, receiverId],
        isGroup: false,
        lastMessage: { text: "Neural Link Established", senderId: senderId }
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize link" });
  }
});

/* ==========================================================
    3️⃣ SAVE NEW MESSAGE
========================================================== */
router.post("/message", checkJwt, async (req, res) => {
  try {
    const { 
      conversationId, text, media, mediaType, 
      isGroup, neuralMood, isSelfDestruct, deliverAt 
    } = req.body;
    
    const senderId = req.auth?.payload?.sub;

    if (!conversationId) return res.status(400).json({ error: "Channel ID required" });

    // Self-destruct logic (TTL) - ১৫ সেকেন্ড পর ডিলিট হবে
    let expireAt = isSelfDestruct ? new Date(Date.now() + 15 * 1000) : null;

    const newMessage = new Message({
      conversationId,
      senderId,
      text: text || "",
      media: media || null,
      mediaType: mediaType || "text",
      neuralMood: neuralMood || "Neural-Flow",
      isGroup: isGroup || false,
      isSelfDestruct: isSelfDestruct || false,
      deliverAt: deliverAt ? new Date(deliverAt) : new Date(), // টাইম ক্যাপসুল হ্যান্ডলিং
      expireAt 
    });

    const savedMessage = await newMessage.save();

    // Conversation আপডেট করা
    let previewText = text || "Attachment received";
    if (isSelfDestruct) previewText = "👻 [Redacted Signal]";
    if (mediaType === "image") previewText = "🖼️ Visual Signal";
    if (mediaType === "voice") previewText = "🎙️ Audio Signal";

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 
        updatedAt: new Date(),
        lastMessage: { text: previewText, senderId: senderId } 
      },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ error: "Signal delivery failed" });
  }
});

/* ==========================================================
    4️⃣ GET MESSAGES
========================================================== */
router.get("/:conversationId", checkJwt, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId || conversationId === "undefined") {
        return res.status(400).json({ error: "Invalid Channel ID" });
    }

    // টাইম ক্যাপসুল লজিক: শুধু সেই মেসেজ আসবে যেগুলো ডেলিভারি টাইম পার হয়ে গেছে
    const messages = await Message.find({
      conversationId: conversationId,
      deliverAt: { $lte: new Date() } 
    }).sort({ createdAt: 1 }).lean();
    
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;