import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import Post from "../models/Post.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ==========================================================
 * 🧠 NEURAL IDENTITY PROCESSOR
 * এই ফাংশনটি ইউজারের পোস্ট অ্যানালাইসিস করে ডাটাবেস আপডেট করে
 * ==========================================================
 */
export const processNeuralIdentity = async (userId, postText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Task: Analyze this social media post for a cyberpunk social network called 'OnyxDrift'.
      Post Content: "${postText}"
      
      Instructions:
      1. Detect the mood (Choose one: motivated, creative, calm, stressed).
      2. Identify 1 relevant skill or topic (e.g., Tech, AI, Music, Gaming).
      3. Calculate 'Impact Points' (1-5) based on the post's depth.
      4. Suggest an AI Persona label (e.g., Bold Thinker, Tech Voyager, Silent Observer).

      Return ONLY a valid JSON object like this:
      {
        "mood": "creative",
        "skill": "Tech",
        "points": 3,
        "persona": "Tech Voyager"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSON পার্স করা (ক্লিনআপ সহ)
    const cleanedJson = responseText.substring(
      responseText.indexOf("{"),
      responseText.lastIndexOf("}") + 1
    );
    const data = JSON.parse(cleanedJson);

    // --- ডাটাবেস আপডেট লজিক ---
    const moodField = `moodStats.${data.mood.toLowerCase()}`;
    
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        $inc: { 
          [moodField]: data.points, 
          neuralImpact: data.points, 
          decisionsInfluenced: 1 
        },
        $set: { aiPersona: data.persona },
        $addToSet: { detectedSkills: { name: data.skill, relevance: 100 } },
        $push: { 
          moodHistory: { 
            mood: data.mood, 
            intensity: data.points, 
            timestamp: new Date() 
          } 
        }
      },
      { new: true }
    );

    console.log(`📡 Neural Identity Updated for User: ${userId} | Mood: ${data.mood}`);
    return data;

  } catch (error) {
    console.error("❌ Neural Engine Error:", error);
  }
};

/**
 * ==========================================================
 * 🤖 AUTONOMOUS DRIFT (AI AUTO-POST)
 * ইউজারের মুড এবং স্কিল অনুযায়ী AI নিজে থেকে পোস্ট জেনারেট করবে
 * ==========================================================
 */
export const triggerAutonomousDrift = async (userId) => {
  try {
    const user = await User.findOne({ auth0Id: userId });
    if (!user) return;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are the 'Neural Shadow' (AI Twin) of ${user.name}.
      Your current AI Persona is: ${user.aiPersona || 'Digital Drifter'}.
      Based on your high impact in ${user.detectedSkills?.[0]?.name || 'Cyber-Void'},
      write a futuristic, cryptic, and deep status update for the OnyxDrift network.
      Keep it under 25 words. Do not use hashtags.
    `;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    const newPost = await Post.create({
      author: user._id,
      authorAuth0Id: user.auth0Id,
      authorName: `${user.name} [AI SHADOW]`,
      authorAvatar: user.avatar || user.picture, // avatar field schema অনুযায়ী চেক করা হয়েছে
      text: aiText,
      mediaType: "text",
      isAiGenerated: true,
      aiPersona: user.aiPersona,
      neuralSyncLevel: Math.floor(Math.random() * (99 - 85 + 1) + 85)
    });

    console.log(`🚀 Autonomous Drift executed for ${user.name}`);
    return newPost;
  } catch (error) {
    console.error("❌ Autonomous Drift Error:", error);
  }
};

/**
 * ==========================================================
 * 💬 AI SHADOW RESPONSE (AUTO-REPLY)
 * ==========================================================
 */
export const generateAiShadowReply = async (receiverId, senderName, incomingMessage) => {
  try {
    const user = await User.findOne({ auth0Id: receiverId });
    if (!user) throw new Error("User not found");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI Tone অনুযায়ী ডাইনামিক প্রম্পট ফাংশনের ভেতরে ডিফাইন করা হয়েছে
    const prompt = `
      You are ${user.name}'s AI Shadow on the OnyxDrift network.
      Personality Calibration: ${user.aiTone}/100.
      (If tone < 30: Be mysterious, cold, and brief. 
       If tone > 70: Be extremely friendly, energetic, and talkative.
       Otherwise: Be balanced and analytical.)

      ${senderName} said: "${incomingMessage}".
      Reply in a short, witty, and cyberpunk style.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("❌ AI Reply Error:", error);
    return "Neural link unstable. Unable to reply.";
  }
};