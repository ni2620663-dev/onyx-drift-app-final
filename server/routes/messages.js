import express from "express";
const router = express.Router();
import { auth } from 'express-oauth2-jwt-bearer';

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      
import User from "../models/User.js";  

// 🛡️ JWT Middleware (Issuer URL dynamic রাখা ভালো, তবে আপনারটা ফিক্সড করে দিচ্ছি)
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com',
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`,
  tokenSigningAlg: 'RS256'
});

/* ==========================================================
    🔍 SEARCH USERS (For New Conversations)
========================================================== */
router.get("/search-users/:query", checkJwt, async (req, res) => {
  try {
    const { query } = req.params;
    const currentUserId = req.auth?.payload.sub; 

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Search query too short" });
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
    console.error("User Search Error:", err);
    res.status(500).json({ error: "Failed to locate drifters" });
  }
});

/* ==========================================================
    1️⃣ GET ALL CONVERSATIONS (Fixed & Optimized)
========================================================== */
router.get("/conversations", checkJwt, async (req, res) => {
  try {
    const currentUserId = req.auth?.payload.sub;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    // ১. সব কনভারসেশন খুঁজে বের করা
    const conversations = await Conversation.find({
      members: { $in: [currentUserId] },
    }).sort({ updatedAt: -1 }).lean();

    // ২. ডিটেইলস পপুলেট করা (Manually handling auth0Id mapping)
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

    // চেক করা হচ্ছে আগে থেকেই কনভারসেশন আছে কিনা
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
    console.error("Link Init Error:", err);
    res.status(500).json({ error: "Failed to initialize link" });
  }
});

/* ==========================================================
    3️⃣ SAVE NEW MESSAGE (Fixed for 500 Error)
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

    // সেলফ-ডিস্ট্রাক্ট TTL লজিক
    let expireAt = null;
    if (isSelfDestruct) {
      expireAt = new Date(Date.now() + 15 * 1000); 
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

    // লাস্ট মেসেজ টেক্সট হ্যান্ডলিং
    let lastMsgText = text || "Media attachment";
    if (isSelfDestruct) lastMsgText = "👻 Self-destructing message";
    else if (mediaType === "image") lastMsgText = "📷 Photo transmitted";
    else if (mediaType === "voice") lastMsgText = "🎙️ Voice note";

    // কনভারসেশন আপডেট (Ensure lastMessage is an object if that's what your schema expects)
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
    4️⃣ GET MESSAGES (With Safety Check)
========================================================== */
router.get("/:conversationId", checkJwt, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Safety check for invalid IDs
    if (!conversationId || conversationId === "undefined") {
        return res.status(400).json({ error: "Valid Conversation ID required" });
    }

    const messages = await Message.find({
      conversationId: conversationId,
      deliverAt: { $lte: new Date() } // টাইম ক্যাপসুল হ্যান্ডলিং
    }).sort({ createdAt: 1 }).lean();
    
    res.status(200).json(messages || []);
  } catch (err) {
    console.error("Fetch Messages Error:", err);
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;