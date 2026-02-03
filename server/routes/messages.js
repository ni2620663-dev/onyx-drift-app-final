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
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`,
  tokenSigningAlg: 'RS256'
});

/* ==========================================================
    🔍 SEARCH USERS BY NAME/EMAIL
========================================================== */
router.get("/search-users/:query", checkJwt, async (req, res) => {
  try {
    const { query } = req.params;
    const currentUserId = req.auth?.payload.sub; 

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Search query too short" });
    }

    const users = await User.find({
      $and: [
        { auth0Id: { $ne: currentUserId } },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { nickname: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } }
          ]
        }
      ]
    })
    .limit(10)
    .select("name nickname email avatar auth0Id isVerified neuralRank"); 

    res.status(200).json(users);
  } catch (err) {
    console.error("User Search Error:", err);
    res.status(500).json({ error: "Failed to locate drifters" });
  }
});

/* ==========================================================
    1️⃣ GET ALL CONVERSATIONS (FIXED WITH USER DETAILS)
========================================================== */
router.get("/conversations", checkJwt, async (req, res) => {
  try {
    const currentUserId = req.auth?.payload.sub;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    // ১. প্রথমে ইউজারের সব কনভারসেশন খুঁজে বের করা
    const conversations = await Conversation.find({
      members: { $in: [currentUserId] },
    }).sort({ updatedAt: -1 });

    // ২. ম্যানুয়ালি মেম্বারদের ডিটেইলস পপুলেট করা (যেহেতু auth0Id স্ট্রিং ব্যবহার করছেন)
    const detailedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const convObj = conv.toObject();

        if (!convObj.isGroup) {
          // অন্য মেম্বারের ID বের করা
          const otherMemberId = convObj.members.find((id) => id !== currentUserId);

          // ইউজার টেবিল থেকে তার ডাটা নিয়ে আসা
          const userDetails = await User.findOne({ auth0Id: otherMemberId }).select(
            "name nickname email avatar auth0Id"
          );

          convObj.userDetails = userDetails || { 
            name: "Unknown Drifter", 
            auth0Id: otherMemberId 
          };
        }
        return convObj;
      })
    );

    res.status(200).json(detailedConversations);
  } catch (err) {
    console.error("Conversation Fetch Error:", err);
    res.status(500).json({ error: "Could not sync conversations" });
  }
});
/* ==========================================================
    2️⃣ CREATE OR GET CONVERSATION
========================================================== */
router.post("/conversation", checkJwt, async (req, res) => {
  const { receiverId, isGroup, groupName, members } = req.body;
  const senderId = req.auth?.payload.sub;

  try {
    if (isGroup) {
      if (!groupName || !members) return res.status(400).json({ error: "Group data missing" });

      const newGroup = new Conversation({
        members: [...new Set([...members, senderId])], 
        isGroup: true,
        groupName: groupName,
        admin: senderId
      });

      const savedGroup = await newGroup.save();
      return res.status(200).json(savedGroup);
    }

    if (!receiverId) return res.status(400).json({ error: "Receiver ID required" });

    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [senderId, receiverId],
        isGroup: false
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize link" });
  }
});

/* ==========================================================
    3️⃣ SAVE NEW MESSAGE (Enhanced with Mood & Media)
========================================================== */
router.post("/message", checkJwt, async (req, res) => {
  try {
    const { 
      conversationId, text, media, mediaType, 
      isGroup, tempId, isSelfDestruct, neuralMood, 
      isTimeCapsule, deliverAt 
    } = req.body;
    
    const senderId = req.auth?.payload.sub;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    let expireAt = null;
    if (isSelfDestruct) {
      expireAt = new Date(Date.now() + 15 * 1000); // ১৫ সেকেন্ড পর ডিলিট হবে
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      text: text || "",
      media: media || null,
      mediaType: mediaType || "text",
      tempId,
      neuralMood: neuralMood || "Neural-Flow",
      isGroup: isGroup || false,
      isSelfDestruct: isSelfDestruct || false,
      isTimeCapsule: isTimeCapsule || false,
      deliverAt: deliverAt || Date.now(),
      expireAt 
    });

    const savedMessage = await newMessage.save();

    // লাস্ট মেসেজ টেক্সট সেট করা
    let lastMsgText = text;
    if (isSelfDestruct) lastMsgText = "👻 Self-destructing message";
    else if (mediaType === "image") lastMsgText = "📷 Photo transmitted";
    else if (mediaType === "voice") lastMsgText = "🎙️ Voice note";

    // কনভারসেশন আপডেট
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 
        updatedAt: Date.now(),
        lastMessage: { text: lastMsgText, senderId: senderId } 
      },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Message Save Error:", err);
    res.status(500).json({ error: "Signal delivery failed" });
  }
});

/* ==========================================================
    4️⃣ GET MESSAGES (Fixed Path)
========================================================== */
router.get("/:conversationId", checkJwt, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // শুধুমাত্র ডেলিভারি টাইম পার হওয়া মেসেজগুলো আসবে (টাইম ক্যাপসুলের জন্য)
    const messages = await Message.find({
      conversationId: conversationId,
      deliverAt: { $lte: new Date() }
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages || []);
  } catch (err) {
    console.error("Fetch Messages Error:", err);
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;