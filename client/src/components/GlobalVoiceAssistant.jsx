import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, BrainCircuit } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from 'react-hot-toast';

// --- Gemini AI Configuration ---
const GEN_AI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY_HERE");

const GlobalVoiceAssistant = ({ user }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const recognitionRef = useRef(null);

  // ১. AI Speech Output (ভয়েস রেসপন্স)
  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; 
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        utterance.voice = voices.find(v => v.name.includes("Google") || v.name.includes("Female")) || voices[0];
    }
    window.speechSynthesis.speak(utterance);
  }, []);

  // ২. Gemini AI Brain (ইন্টেন্ট এক্সট্রাকশন)
  const askGemini = async (prompt, type = "general") => {
    try {
      const model = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let systemPrompt = "";
      if (type === "calendar") {
        systemPrompt = `Extract title and time from: "${prompt}". Return only in this format: Title | Time. If time is not mentioned, use "Upcoming".`;
      } else {
        systemPrompt = `Context: You are OnyxDrift AI for ${user?.name || 'User'}. Respond to: "${prompt}" in under 15 words.`;
      }
      
      const result = await model.generateContent(systemPrompt);
      return result.response.text();
    } catch (error) {
      return "Neural link error.";
    }
  };

  // ৩. ক্যালেন্ডার ইভেন্ট তৈরির মক ফাংশন
  const createNeuralEvent = async (title, date, time) => {
    try {
      // এখানে ভবিষ্যতে আপনার API কল হবে
      console.log(`Syncing: ${title} on ${date} at ${time}`);
      return { success: true, message: `Meeting "${title}" synced at ${time}` };
    } catch (error) {
      return { success: false };
    }
  };

  // ৪. Neural Engine (কমান্ড প্রসেসর)
  const processNeuralAI = useCallback(async (transcript) => {
    const cmd = transcript.toLowerCase().trim();
    setIsAiThinking(true);

    // --- কুইক নেভিগেশন ---
    const navMap = {
      "home": "/feed", "feed": "/feed",
      "chat": "/messages", "messages": "/messages",
      "profile": `/profile/${user?.nickname || 'me'}`,
      "reels": "/reels"
    };

    const foundPath = Object.keys(navMap).find(key => cmd.includes(key));

    if (foundPath) {
      speak(`Accessing ${foundPath} terminal.`);
      navigate(navMap[foundPath]);
    } 
    // --- স্মার্ট ক্যালেন্ডার এজেন্ট (FIXED) ---
    else if (cmd.includes("schedule") || cmd.includes("meeting")) {
      const aiData = await askGemini(cmd, "calendar");
      const [title, time] = aiData.split("|").map(s => s.trim());
      
      speak(`Scheduling ${title}.`);
      const result = await createNeuralEvent(title, "Today", time);
      
      if (result.success) {
        toast.success(result.message);
        speak("Calendar updated.");
      }
    }
    // --- সাধারণ প্রশ্ন বা ইমেইল ড্রাফট ---
    else if (cmd.includes("write") || cmd.includes("email") || cmd.includes("who") || cmd.includes("what")) {
      const aiResponse = await askGemini(cmd);
      speak(aiResponse);
      toast(aiResponse, { icon: '🤖' });
    }
    // --- স্ক্রল কন্ট্রোল ---
    else if (cmd.includes("scroll down")) {
      window.scrollBy({ top: 600, behavior: "smooth" });
    } else if (cmd.includes("scroll up")) {
      window.scrollBy({ top: -600, behavior: "smooth" });
    } 
    else {
      speak("Command received.");
    }
    
    setIsAiThinking(false);
  }, [navigate, user, speak]);

  // ৫. স্পিচ রেকগনিশন সেটআপ
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setLastCommand(transcript);
        processNeuralAI(transcript);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
      };
    }
    return () => recognitionRef.current?.stop();
  }, [isListening, processNeuralAI]);

  // টগল হ্যান্ডলার
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      speak("Neural link offline.");
    } else {
      setIsListening(true);
      speak("Neural Link Established.");
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[99999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-black/90 backdrop-blur-2xl border border-cyan-500/40 p-5 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-[260px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [6, 14, 6] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1 bg-cyan-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-[9px] text-cyan-400 font-black uppercase tracking-[0.4em]">
                {isAiThinking ? "Syncing..." : "Neural Link"}
              </span>
            </div>
            <p className="text-white/80 text-[12px] italic font-medium leading-snug">
              {lastCommand ? `"${lastCommand}"` : "Awaiting Command..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleListening}
        className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
          isListening 
          ? 'bg-cyan-500 border-white text-black shadow-[0_0_30px_#06b6d4]' 
          : 'bg-zinc-950 border-cyan-900/50 text-cyan-500'
        }`}
      >
        {isAiThinking ? (
          <Sparkles className="animate-spin" size={28} />
        ) : isListening ? (
          <Mic size={28} className="animate-pulse" />
        ) : (
          <MicOff size={28} className="opacity-40" />
        )}
      </motion.button>
    </div>
  );
};

export default GlobalVoiceAssistant;