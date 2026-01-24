import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

/**
 * 🚀 PHASE-10: CREATE NEW MESSAGE 
 * With Self-Destruct (TTL) & Optimistic UI Support
 */
export const createMessage = async (req, res) => {
  const { 
    conversationId, 
    senderId, 
    senderName, 
    senderAvatar, 
    text, 
    tempId, 
    isSelfDestruct,
    media,
    mediaType 
  } = req.body;

  try {
    // ১. সেলফ-ডিস্ট্রাক্ট লজিক: যদি ট্রু হয়, তবে ১৫ সেকেন্ড পর ডিলিট হওয়ার টাইমস্ট্যাম্প সেট হবে
    let expireAt = null;
    if (isSelfDestruct) {
      expireAt = new Date(Date.now() + 15 * 1000); // ১৫ সেকেন্ড লাইফটাইম
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      text,
      tempId,
      media,
      mediaType: mediaType || "text",
      isSelfDestruct,
      expireAt // ডাটাবেস লেভেলে TTL ডিলিট ট্রিগার করবে
    });

    const savedMessage = await newMessage.save();

    // ২. কনভারসেশনের 'lastMessage' আপডেট করা (যাতে চ্যাট লিস্টে লেটেস্ট মেসেজ দেখায়)
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { 
        lastMessage: text || "Sent a media file",
        updatedAt: Date.now() 
      }
    });

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Message Error:", err);
    res.status(500).json({ error: "Could not send message signal." });
  }
};

/**
 * 📥 GET MESSAGES
 * চ্যাট হিস্ট্রি দ্রুত লোড করার জন্য ইনডেক্সড কোয়েরি
 */
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 }); // পুরনো থেকে নতুন ক্রমে সাজানো

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

/**
 * 👀 MARK AS SEEN
 * মেসেজ রিড স্ট্যাটাস আপডেট
 */
export const markMessageSeen = async (req, res) => {
  try {
    const { messageId, userId } = req.body;
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { seenBy: { userId, seenAt: Date.now() } }
      },
      { new: true }
    );
    res.status(200).json(updatedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
};

/**
 * 🗑️ DELETE MESSAGE (Manual)
 */
export const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.messageId);
    res.status(200).json("Message deleted from reality.");
  } catch (err) {
    res.status(500).json(err);
  }
};