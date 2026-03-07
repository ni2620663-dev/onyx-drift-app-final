// server/services/NeuralCore.js
import User from "../models/User.js";
import Message from "../models/Message.js";

export const NeuralCore = {
  
  // ১. ইউজারের কাজের প্যাটার্ন বিশ্লেষণ (গত ৩০ দিনের ডেটা)
  async analyzeUserPatterns(auth0Id) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const patterns = await Message.aggregate([
      { $match: { senderId: auth0Id, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { hour: { $hour: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    return patterns;
  },

  // ২. এআই ডিসিশন মেকিং এবং প্যাটার্ন প্রেডিকশন
  async predictAction(auth0Id, intent) {
    const user = await User.findOne({ auth0Id });
    if (!user) return { action: "NONE", status: "USER_NOT_FOUND" };

    // যদি ইউজার মিটিং শিডিউল করতে চায়
    if (intent === "SCHEDULE_MEETING") {
      const preferredTime = user.neuralPatterns?.meetingTimes?.[0] || "10:00 AM";
      return { 
        action: "SUGGEST_TIME", 
        suggested: preferredTime,
        confidence: 0.95 
      };
    }

    // যদি AI নিজে থেকে ইউজারের অভ্যাসের ওপর পরামর্শ দিতে চায়
    if (intent === "GET_PERSONALIZED_ADVICE") {
      const topPatterns = await this.analyzeUserPatterns(auth0Id);
      const isBusyHour = topPatterns.some(p => p._id.hour >= 9 && p._id.hour <= 17);
      
      return {
        action: "ADVICE",
        message: isBusyHour ? "You are usually busy during work hours. I suggest scheduling meetings after 5 PM." : "You have some free slots today!",
        confidence: 0.88
      };
    }

    return { action: "NONE", status: "IDLE" };
  },

  // ৩. প্যাটার্ন সেভিং (ইউজারের অ্যাকশন থেকে শিখবে)
  async learnPattern(auth0Id, actionType) {
    await User.updateOne(
      { auth0Id },
      { $push: { "neuralPatterns.recentActions": { action: actionType, timestamp: new Date() } } }
    );
  }
};