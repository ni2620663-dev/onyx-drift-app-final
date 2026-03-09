/**
 * NeuralCore: OnyxDrift Intelligence Service
 * Gemini AI বা LLM ব্যবহার করে ইউজারের ইনটেন্ট এবং কন্টেক্সট বিশ্লেষণ করে।
 */

// আপনার Gemini API Key এখানে সেট করবেন (Environment Variable ব্যবহার করা ভালো)
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const NeuralCore = {
  
  // ১. এআই দিয়ে ইউজারের ইনপুট বিশ্লেষণ (Semantic Analysis)
  async analyzeIntent(input, userContext) {
    try {
      // যদি API Key না থাকে, তবে আগের স্ট্যাটিক লজিক কাজ করবে (Fallback)
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        return this.staticFallback(input);
      }

      const prompt = `
        You are the OnyxDrift Neural OS. Analyze the user input and context.
        Return ONLY a JSON object with this structure: { "action": "ACTION_NAME", "path": "/url", "command": "cmd" }
        
        Possible Actions: NAVIGATE, AUTO_REPLY, ACTIVATE_DND, EXECUTE_CALL, NONE
        Current Context: ${JSON.stringify(userContext)}
        User Input: "${input}"
      `;

      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const aiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
      return aiResponse;

    } catch (err) {
      console.error("NeuralCore: AI Processing Failed, using fallback.", err);
      return this.staticFallback(input);
    }
  },

  // ২. ফালব্যাক লজিক (যদি ইন্টারনেট বা এপিআই কাজ না করে)
  staticFallback(input) {
    const cmd = input.toLowerCase();
    if (cmd.includes("home") || cmd.includes("feed")) return { action: 'NAVIGATE', path: '/feed' };
    if (cmd.includes("message")) return { action: 'NAVIGATE', path: '/messages' };
    if (cmd.includes("like") || cmd === "LIKE_ACTION") return { action: 'AUTO_REPLY' };
    return { action: 'NONE' };
  },

  // ৩. মূল প্রসেসিং ফাংশন যা App.jsx কল করে
  async process(input, userContext) {
    console.log("Onyx-Core: Syncing with Neural Cloud...");
    
    // AI বা স্ট্যাটিক লজিক থেকে সিদ্ধান্ত নেওয়া
    const decision = await this.analyzeIntent(input, userContext);
    
    // কন্টেক্সট অনুযায়ী সিদ্ধান্ত রিফাইন করা
    if (userContext.isWorking && decision.action === 'AUTO_REPLY') {
        decision.message = "User is busy. System performed the action automatically.";
    }

    return decision;
  }
};