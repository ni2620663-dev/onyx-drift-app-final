import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js"; 

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      

/* ==========================================================
   1️⃣ GET ALL CONVERSATIONS
   Route: GET /api/messages/conversations
========================================================== */
router.get("/conversations", auth, async (req, res) => {
  try {
    const currentUserId = req.user?.sub || req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    // চ্যাট লিস্ট খুঁজে বের করা এবং লেটেস্ট আপডেট হওয়া চ্যাট আগে রাখা
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
  const { receiverId } = req.body;
  const senderId = req.user?.sub || req.user?.id;

  if (!receiverId) return res.status(400).json({ error: "Receiver ID required" });

  try {
    // চেক করা হচ্ছে অলরেডি কনভারসেশন বিদ্যমান কি না
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [senderId, receiverId],
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error("Conversation Post Error:", err);
    res.status(500).json({ error: "Failed to initialize neural link" });
  }
});

/* ==========================================================
   3️⃣ SAVE NEW MESSAGE (Fixed 500 Error & Duplicate Prevention)
   Route: POST /api/messages/message
========================================================== */
router.post("/message", auth, async (req, res) => {
  try {
    // ফ্রন্টএন্ড থেকে আসা ডাটা রিসিভ
    const { conversationId, text, tempId } = req.body;
    const senderId = req.user?.sub || req.user?.id;

    if (!conversationId || !text) {
      return res.status(400).json({ error: "Data missing: conversationId or text required" });
    }

    // মেসেজ অবজেক্ট তৈরি (স্কিমা অনুযায়ী senderId এবং tempId সহ)
    const newMessage = new Message({
      conversationId,
      senderId: senderId, // ফ্রন্টএন্ড ফিল্ডের সাথে ম্যাচিং
      text,
      tempId // ডুপ্লিকেট চেকের জন্য জরুরি
    });

    const savedMessage = await newMessage.save();

    // চ্যাট লিস্টের updatedAt এবং lastMessage আপডেট করা
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 
        updatedAt: Date.now(),
        lastMessage: text 
      },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Message Post Error:", err);
    res.status(500).json({ 
      error: "Message delivery failed", 
      details: err.message 
    });
  }
});

/* ==========================================================
   4️⃣ GET MESSAGES OF A CONVERSATION
   Route: GET /api/messages/message/:conversationId
========================================================== */
router.get("/message/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // মেসেজগুলো টাইম অনুযায়ী সাজানো (Oldest to Newest)
    const messages = await Message.find({
      conversationId: conversationId,
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (err) {
    console.error("Message Get Error:", err);
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;