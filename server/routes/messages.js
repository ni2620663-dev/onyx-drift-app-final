import express from "express";
const router = express.Router();

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      

/* ==========================================================
   1️⃣ CREATE OR GET CONVERSATION
   Route: POST api/messages/conversation
========================================================== */
router.post("/conversation", async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    // চেক করি আগে থেকেই কোনো কনভারসেশন আছে কি না
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      // না থাকলে নতুন কনভারসেশন তৈরি করি
      conversation = new Conversation({
        members: [senderId, receiverId],
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error("Neural Link Error:", err);
    res.status(500).json({ error: "Failed to initialize neural link" });
  }
});

/* ==========================================================
   2️⃣ GET ALL CONVERSATIONS OF A USER (Fixes 404 Plural Error)
   Route: GET api/messages/conversations/:userId
========================================================== */
router.get("/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // ইউজারের সব কনভারসেশন খুঁজে বের করা
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error("Conversation Fetch Error:", err);
    res.status(500).json({ error: "Could not sync conversations" });
  }
});

/* ==========================================================
   3️⃣ SAVE NEW MESSAGE
   Route: POST api/messages/message
========================================================== */
router.post("/message", async (req, res) => {
  try {
    const { conversationId, sender, text } = req.body;

    // নতুন মেসেজ অবজেক্ট
    const newMessage = new Message({
      conversationId,
      sender,
      text
    });

    const savedMessage = await newMessage.save();

    // মেসেজ পাঠানোর পর মেইন কনভারসেশনের সময় আপডেট করা
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { updatedAt: Date.now() },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Message Transmission Error:", err);
    res.status(500).json({ error: "Message delivery failed" });
  }
});

/* ==========================================================
   4️⃣ GET MESSAGES OF A CONVERSATION
   Route: GET api/messages/message/:conversationId
========================================================= */
router.get("/message/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (err) {
    console.error("History Fetch Error:", err);
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;