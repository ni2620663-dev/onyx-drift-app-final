import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js"; 

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      

/* ==========================================================
   1️⃣ GET ALL CONVERSATIONS
   সব চ্যাট এবং গ্রুপ লিস্ট নিয়ে আসবে
========================================================== */
router.get("/conversations", auth, async (req, res) => {
  try {
    const currentUserId = req.user?.sub || req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Neural identity missing" });
    }

    // ইউজার যে যে চ্যাটের মেম্বার সেগুলো সব খুঁজে বের করা
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
   2️⃣ CREATE OR GET CONVERSATION (Private/Group)
   নতুন চ্যাট বা গ্রুপ তৈরি করবে
========================================================== */
router.post("/conversation", auth, async (req, res) => {
  const { receiverId, isGroup, groupName, members } = req.body;
  const senderId = req.user?.sub || req.user?.id;

  try {
    // যদি এটি গ্রুপ চ্যাট হয়
    if (isGroup) {
      if (!groupName || !members) return res.status(400).json({ error: "Group data missing" });

      const newGroup = new Conversation({
        members: [...new Set([...members, senderId])], // সেন্ডারসহ মেম্বার লিস্ট
        isGroup: true,
        groupName: groupName,
        admin: senderId
      });

      const savedGroup = await newGroup.save();
      return res.status(200).json(savedGroup);
    }

    // যদি এটি ওয়ান-টু-ওয়ান প্রাইভেট চ্যাট হয়
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
   3️⃣ SAVE NEW MESSAGE (Supports Text, Photo, Video)
   মেসেজ সেভ করবে এবং চ্যাট লিস্টে লাস্ট মেসেজ আপডেট করবে
========================================================== */
router.post("/message", auth, async (req, res) => {
  try {
    const { conversationId, text, media, mediaType, isGroup, tempId } = req.body;
    const senderId = req.user?.sub || req.user?.id;
    const senderName = req.user?.name || "Drifter";

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    // নতুন মেসেজ অবজেক্ট তৈরি
    const newMessage = new Message({
      conversationId,
      senderId,
      senderName,
      text: text || "",
      media: media || null,      // ফটো বা ভিডিওর URL
      mediaType: mediaType || "text", // image, video অথবা text
      tempId,
      isGroup: isGroup || false
    });

    const savedMessage = await newMessage.save();

    // চ্যাট লিস্টে প্রিভিউ টেক্সট সেট করা
    let lastMsgPreview = text;
    if (mediaType === "image") lastMsgPreview = "📷 Photo transmitted";
    if (mediaType === "video") lastMsgPreview = "🎥 Video transmitted";

    // কনভারসেশন মডেল আপডেট
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 
        updatedAt: Date.now(),
        lastMessage: lastMsgPreview 
      },
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Message Save Error:", err);
    res.status(500).json({ error: "Signal delivery failed" });
  }
});

/* ==========================================================
    👥 GROUP SETTINGS & MEMBER UPDATE
========================================================== */

// ১. গ্রুপের নাম বা ছবি পরিবর্তন
router.patch("/group/settings/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { groupName, groupAvatar } = req.body;

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { groupName, groupAvatar } },
      { new: true }
    );

    res.status(200).json(updatedGroup);
  } catch (err) {
    res.status(500).json({ error: "Group settings update failed" });
  }
});

// ২. গ্রুপে নতুন মেম্বার যুক্ত করা
router.patch("/group/add-members/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { newMembers } = req.body; // এটি একটি অ্যারে হতে হবে [userId1, userId2]

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { members: { $each: newMembers } } }, // ডুপ্লিকেট হবে না
      { new: true }
    );

    res.status(200).json(updatedGroup);
  } catch (err) {
    res.status(500).json({ error: "Failed to add new members to the squad" });
  }
});
/* ==========================================================
   4️⃣ GET MESSAGES OF A CONVERSATION
   পুরনো মেসেজ হিস্ট্রি লোড করা
========================================================== */
router.get("/message/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({
      conversationId: conversationId,
    }).sort({ createdAt: 1 }); // পুরনো থেকে নতুন সাজানো
    
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;