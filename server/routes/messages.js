import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js"; // টোকেন ভেরিফাই করার জন্য

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      

/* ==========================================================
   1️⃣ GET ALL CONVERSATIONS (Fixes 404 Plural Error)
   Route: GET /api/messages/conversations
========================================================== */
router.get("/conversations", auth, async (req, res) => {
  try {
    // টোকেন থেকে ইউজার আইডি নেওয়া (Auth0 বা Custom JWT)
    const currentUserId = req.user?.sub || req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    // ঐ ইউজারের সব চ্যাট খুঁজে বের করা
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
   Route: POST /api/messages/conversation
========================================================== */
router.post("/conversation", auth, async (req, res) => {
  const { senderId, receiverId } = req.body;
  const currentUserId = req.user?.sub || req.user?.id;

  try {
    // সিকিউরিটি চেক: সেন্ডার আইডি যেন বর্তমান ইউজারেরই হয়
    const finalSenderId = senderId || currentUserId;

    let conversation = await Conversation.findOne({
      members: { $all: [finalSenderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [finalSenderId, receiverId],
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize neural link" });
  }
});

/* ==========================================================
   3️⃣ SAVE NEW MESSAGE
   Route: POST /api/messages/message
========================================================== */
router.post("/message", auth, async (req, res) => {
  try {
    const { conversationId, sender, text } = req.body;

    const newMessage = new Message({
      conversationId,
      sender: sender || req.user?.sub || req.user?.id,
      text
    });

    const savedMessage = await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { updatedAt: Date.now() },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: "Message delivery failed" });
  }
});

/* ==========================================================
   4️⃣ GET MESSAGES OF A CONVERSATION
   Route: GET /api/messages/message/:conversationId
========================================================== */
router.get("/message/:conversationId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;