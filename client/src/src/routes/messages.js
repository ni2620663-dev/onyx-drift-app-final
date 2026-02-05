import express from "express";
const router = express.Router();
import Conversation from "../data_models/conversation.js";
import Message from "../data_models/message.js";

// ১. নতুন কনভারসেশন তৈরি করা (যখন কেউ প্রথম মেসেজ দিবে)
router.post("/conversation", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ২. কোনো নির্দিষ্ট ইউজারের সব কনভারসেশন লিস্ট পাওয়া
router.get("/conversation/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ৩. নতুন মেসেজ পাঠানো
router.post("/message", async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ৪. একটি কনভারসেশনের সব মেসেজ হিস্টোরি পাওয়া
router.get("/message/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;