import express from "express";
const router = express.Router();
import { auth } from 'express-oauth2-jwt-bearer';
import mongoose from "mongoose"; // 👈 ID ভ্যালিডেশনের জন্য

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      
import User from "../models/User.js";  

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
        { nickname: { $regex: query, $options: "i" } }
      ]
    })
    .limit(8)
    .select("name nickname avatar auth0Id neuralRank")
    .lean(); 

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to locate drifters" });
  }
});

/* ==========================================================
    1️⃣ GET ALL CONVERSATIONS (Populated)
========================================================== */
router.get("/conversations", checkJwt, async (req, res) => {
  try {
    const currentUserId = req.auth?.payload?.sub;

    const conversations = await Conversation.find({
      members: { $in: [currentUserId] },
    }).sort({ updatedAt: -1 }).lean();

    const detailedConversations = await Promise.all(
      conversations.map(async (conv) => {
        if (!conv.isGroup) {
          const otherMemberId = conv.members.find((id) => id !== currentUserId);
          const userDetails = await User.findOne({ auth0Id: otherMemberId })
            .select("name nickname avatar auth0Id neuralRank")
            .lean();
          conv.userDetails = userDetails;
        }
        return conv;
      })
    );

    res.status(200).json(detailedConversations);
  } catch (err) {
    res.status(500).json({ error: "Could not sync conversations" });
  }
});

/* ==========================================================
    2️⃣ SAVE NEW MESSAGE (With Security Check)
========================================================== */
router.post("/message", checkJwt, async (req, res) => {
  try {
    const { 
      conversationId, text, media, mediaType, 
      neuralMood, isSelfDestruct, deliverAt 
    } = req.body;
    
    const senderId = req.auth?.payload?.sub;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ error: "Invalid Channel ID" });
    }

    // 🛡️ SECURITY: ইউজার কি এই কনভারসেশনের মেম্বার?
    const conversation = await Conversation.findOne({
        _id: conversationId,
        members: { $in: [senderId] }
    });

    if (!conversation) {
        return res.status(403).json({ error: "Access Denied to this Neural Link" });
    }

    let expireAt = isSelfDestruct ? new Date(Date.now() + 15 * 1000) : null;

    const newMessage = new Message({
      conversationId,
      senderId,
      text: text || "",
      media: media || null,
      mediaType: mediaType || "text",
      neuralMood: neuralMood || "Neural-Flow",
      isSelfDestruct: isSelfDestruct || false,
      deliverAt: deliverAt ? new Date(deliverAt) : new Date(),
      expireAt 
    });

    const savedMessage = await newMessage.save();

    // Conversation আপডেট
    let previewText = text || "Attachment";
    if (isSelfDestruct) previewText = "👻 [Redacted]";
    else if (mediaType === "voice") previewText = "🎙️ Audio Signal";
    else if (mediaType === "image") previewText = "🖼️ Visual Signal";

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 
        updatedAt: new Date(),
        lastMessage: { text: previewText, senderId: senderId } 
      },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: "Signal delivery failed" });
  }
});

/* ==========================================================
    3️⃣ GET MESSAGES (Optimized)
========================================================== */
router.get("/:conversationId", checkJwt, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.auth?.payload?.sub;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ error: "Invalid Channel ID" });
    }

    // টাইম ক্যাপসুল লজিক + ডেলিভারি টাইম ফিল্টার
    const messages = await Message.find({
      conversationId: conversationId,
      deliverAt: { $lte: new Date() } 
    })
    .sort({ createdAt: 1 })
    .limit(50) // মেমরি সেভ করার জন্য লিমিট
    .lean();
    
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;