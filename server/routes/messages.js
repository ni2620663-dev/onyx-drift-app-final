import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js"; 

// মডেল ইম্পোর্ট
import Conversation from "../models/Conversation.js"; 
import Message from "../models/Message.js";      

/* ==========================================================
   1️⃣ GET ALL CONVERSATIONS
   সব চ্যাট এবং গ্রুপ লিস্ট নিয়ে আসবে
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
   2️⃣ CREATE OR GET CONVERSATION (Private/Group)
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
   3️⃣ SAVE NEW MESSAGE (With Phase-10 Self-Destruct Logic)
========================================================== */
router.post("/message", auth, async (req, res) => {
  try {
    const { conversationId, text, media, mediaType, isGroup, tempId, isSelfDestruct } = req.body;
    const senderId = req.user?.sub || req.user?.id;
    const senderName = req.user?.name || "Drifter";

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    // 🚀 PHASE-10: TTL (Time To Live) Logic
    // যদি সেলফ-ডিস্ট্রাক্ট অন থাকে, তবে ১৫ সেকেন্ড পরের একটি টাইমস্ট্যাম্প জেনারেট হবে
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
      expireAt // এটি MongoDB-এর TTL ইনডেক্সকে ট্রিগার করবে
    });

    const savedMessage = await newMessage.save();

    // চ্যাট লিস্ট প্রিভিউ আপডেট
    let lastMsgPreview = text;
    if (isSelfDestruct) lastMsgPreview = "👻 Self-destructing message";
    else if (mediaType === "image") lastMsgPreview = "📷 Photo transmitted";
    else if (mediaType === "video") lastMsgPreview = "🎥 Video transmitted";

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
    🛡️ PHASE-11: GROUP ADMIN POWERS (Kick & Promote)
========================================================== */

// ১. কিক আউট (Remove Member) - শুধুমাত্র অ্যাডমিন পারবে
router.patch("/group/kick/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userIdToRemove } = req.body;
    const currentUserId = req.user?.sub || req.user?.id;

    // আগে চেক করা যে রিকোয়েস্টকারী অ্যাডমিন কি না
    const group = await Conversation.findById(conversationId);
    if (group.admin !== currentUserId) {
      return res.status(403).json({ error: "Access Denied: Only Admins can kick drifters." });
    }

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { members: userIdToRemove } }, // মেম্বার লিস্ট থেকে রিমুভ
      { new: true }
    );

    res.status(200).json({ message: "Drifter removed from the squad", updatedGroup });
  } catch (err) {
    res.status(500).json({ error: "Failed to purge member." });
  }
});

// ২. প্রোমোট টু অ্যাডমিন (Promote Member)
router.patch("/group/promote/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { newAdminId } = req.body;
    const currentUserId = req.user?.sub || req.user?.id;

    const group = await Conversation.findById(conversationId);
    if (group.admin !== currentUserId) {
      return res.status(403).json({ error: "Only the current Admin can transfer power." });
    }

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { admin: newAdminId } },
      { new: true }
    );

    res.status(200).json({ message: "New Admin established.", updatedGroup });
  } catch (err) {
    res.status(500).json({ error: "Power transfer failed." });
  }
});

/* ==========================================================
   👥 GROUP SETTINGS & MEMBER UPDATE
========================================================== */

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

router.patch("/group/add-members/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { newMembers } = req.body;

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { members: { $each: newMembers } } },
      { new: true }
    );

    res.status(200).json(updatedGroup);
  } catch (err) {
    res.status(500).json({ error: "Failed to add new members to the squad" });
  }
});

/* ==========================================================
   4️⃣ GET MESSAGES OF A CONVERSATION
========================================================== */
router.get("/message/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({
      conversationId: conversationId,
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Neural history inaccessible" });
  }
});

export default router;