import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js"; 

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      
import User from "../models/User.js"; 

/* ==========================================================
   🔍 SEARCH USERS BY NAME/EMAIL (Optimized for your Model)
========================================================== */
router.get("/search-users/:query", auth, async (req, res) => {
  try {
    const { query } = req.params;
    const currentUserId = req.user?.sub || req.user?.id; // Auth0 থেকে আসা ID

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Search query too short" });
    }

    // আপনার মডেলের 'auth0Id' ফিল্ড অনুযায়ী সার্চ ফিল্টার
    const users = await User.find({
      $and: [
        { auth0Id: { $ne: currentUserId } }, // নিজেকে লিস্ট থেকে বাদ দেওয়া
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
    res.status(500).json({ error: "Failed to locate drifters in the neural net" });
  }
});

/* ==========================================================
   1️⃣ GET ALL CONVERSATIONS
========================================================== */
router.get("/conversations", auth, async (req, res) => {
  try {
    const currentUserId = req.user?.sub || req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    const conversations = await Conversation.find({
      members: { $in: [currentUserId] },
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error("Conversation Fetch Error:", err);
    res.status(500).json({ error: "Could not sync conversations" });
  }
});

/* ==========================================================
   2️⃣ CREATE OR GET CONVERSATION
========================================================== */
router.post("/conversation", auth, async (req, res) => {
  const { receiverId, isGroup, groupName, members } = req.body;
  const senderId = req.user?.sub || req.user?.id;

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

    // receiverId এখানে ইউজারের auth0Id হিসেবে কাজ করবে
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
   🗑️ DELETE CONVERSATION
========================================================== */
router.delete("/conversation/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    await Conversation.findByIdAndDelete(id);
    await Message.deleteMany({ conversationId: id });
    
    res.status(200).json({ message: "Conversation purged from neural link" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/* ==========================================================
   3️⃣ SAVE NEW MESSAGE
========================================================== */
router.post("/message", auth, async (req, res) => {
  try {
    const { conversationId, text, media, mediaType, isGroup, tempId, isSelfDestruct } = req.body;
    const senderId = req.user?.sub || req.user?.id;
    const senderName = req.user?.name || "Drifter";

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    let expireAt = null;
    if (isSelfDestruct) {
      expireAt = new Date(Date.now() + 15 * 1000); 
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      senderName,
      text: text || "",
      media: media || null,
      mediaType: mediaType || "text",
      tempId,
      isGroup: isGroup || false,
      isSelfDestruct: isSelfDestruct || false,
      expireAt 
    });

    const savedMessage = await newMessage.save();

    let lastMsgText = text;
    if (isSelfDestruct) lastMsgText = "👻 Self-destructing message";
    else if (mediaType === "image") lastMsgText = "📷 Photo transmitted";
    else if (mediaType === "voice") lastMsgText = "🎙️ Voice note";

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
   4️⃣ GET MESSAGES
========================================================== */
router.get("/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({
      conversationId: conversationId,
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages || []);
  } catch (err) {
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;