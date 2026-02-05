import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    
    // JSON পার্স করা (মাঝে মাঝে এআই অতিরিক্ত টেক্সট দিলে তা ক্লিন করার জন্য)
    const cleanedJson = responseText.substring(
      responseText.indexOf("{"),
      responseText.lastIndexOf("}") + 1
    );
    const data = JSON.parse(cleanedJson);

    // --- ডাটাবেস আপডেট লজিক ---
    const moodField = `moodStats.${data.mood.toLowerCase()}`;
    
    await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        $inc: { 
          [moodField]: data.points, // নির্দিষ্ট মুডের পয়েন্ট বাড়ানো
          neuralImpact: data.points, // টোটাল ইমপ্যাক্ট বাড়ানো
          decisionsInfluenced: 1 
        },
        $set: { aiPersona: data.persona },
        $addToSet: { detectedSkills: { name: data.skill, relevance: 100 } }, // নতুন স্কিল যোগ করা
        $push: { 
          moodHistory: { 
            mood: data.mood, 
            intensity: data.points, 
            timestamp: new Date() 
          } 
        }
      }
    );

    console.log(`📡 Neural Identity Updated for User: ${userId}`);
  } catch (error) {
    console.error("❌ Neural Engine Error:", error);
  }
};