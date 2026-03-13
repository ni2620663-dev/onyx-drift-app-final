import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const GlobalVoiceAssistant = ({ user }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // ১. AI Voice Response (Text-to-Speech)
  const speak = (text) => {
    // আগের কোনো কথা চলতে থাকলে তা বন্ধ করা
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    // ফিমেইল ভয়েস সেট করার চেষ্টা (ঐচ্ছিক)
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) utterance.voice = voices[0]; 
    window.speechSynthesis.speak(utterance);
  };

  // ২. কমান্ড এক্সিকিউশন ইঞ্জিন
  const executeCommand = useCallback((command) => {
    const cmd = command.toLowerCase().trim();
    setLastCommand(cmd);

    // --- নেভিগেশন ---
    if (cmd.includes("open home") || cmd.includes("feed")) {
      speak("Navigating to home feed");
      navigate("/feed");
    }
    else if (cmd.includes("messages") || cmd.includes("chat")) {
      speak("Opening your neural messages");
      navigate("/messages");
    }
    else if (cmd.includes("profile")) {
      speak("Opening your operator profile");
      navigate(`/profile/${user?.nickname || 'me'}`);
    }
    else if (cmd.includes("reels") || cmd.includes("video")) {
      speak("Initializing Reels terminal");
      navigate("/reels");
    }

    // --- স্ক্রল এবং মিডিয়া কন্ট্রোল ---
    else if (cmd.includes("next") || cmd.includes("scroll down")) {
      window.scrollBy({ top: window.innerHeight - 100, behavior: "smooth" });
    }
    else if (cmd.includes("back") || cmd.includes("scroll up")) {
      window.scrollBy({ top: -(window.innerHeight - 100), behavior: "smooth" });
    }
    else if (cmd.includes("pause")) {
      document.querySelectorAll('video').forEach(v => v.pause());
      speak("Media suspended");
    }
    else if (cmd.includes("play")) {
      document.querySelectorAll('video').forEach(v => v.play());
      speak("Media resumed");
    }

    // --- সোশ্যাল অ্যাকশন ---
    else if (cmd.includes("like this")) {
      const likeBtn = document.querySelector('[aria-label="like"]') || document.querySelector('.heart-icon');
      if (likeBtn) {
        likeBtn.click();
        toast.success("Liked via Voice Command");
      } else {
        speak("No interactive element found");
      }
    }

    // --- সার্চ ---
    else if (cmd.includes("search for")) {
      const query = cmd.split("search for")[1];
      if (query) {
        speak(`Searching the network for ${query}`);
        navigate(`/search?q=${query.trim()}`);
      }
    }

    // --- সিস্টেম কোয়েরি ---
    else if (cmd.includes("who am i")) {
      speak(`You are ${user?.name || 'Operator Rafi'}. All systems are nominal.`);
    }
    else if (cmd.includes("dark mode")) {
      document.documentElement.classList.add('dark');
      speak("Dark vision enabled");
    }
    else if (cmd.includes("light mode")) {
      document.documentElement.classList.remove('dark');
      speak("Light mode active");
    }

  }, [navigate, user]);

  // ৩. Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        executeCommand(transcript);
      };

      recognitionRef.current.onend = () => {
        // যদি লিসেনিং অন থাকে কিন্তু ব্রাউজার অটো বন্ধ করে দেয়, তবে আবার চালু করা
        if (isListening) {
          restartTimeoutRef.current = setTimeout(() => {
            recognitionRef.current.start();
          }, 100);
        }
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied");
          setIsListening(false);
        }
      };
    }

    if (isListening) {
      try {
        recognitionRef.current.start();
        toast.success("Neural Voice Link Active", { 
          style: { background: '#000', color: '#06b6d4', border: '1px solid #0891b2' }
        });
      } catch (e) {
        console.log("Recognition already started");
      }
    } else {
      recognitionRef.current.stop();
      clearTimeout(restartTimeoutRef.current);
    }

    return () => {
      recognitionRef.current?.stop();
      clearTimeout(restartTimeoutRef.current);
    };
  }, [isListening, executeCommand]);

  return (
    <div className="fixed bottom-24 right-6 z-[99999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] max-w-[220px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <div className="w-1 h-3 bg-cyan-500 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-1 h-3 bg-cyan-500 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1 h-3 bg-cyan-500 animate-[bounce_1s_infinite_400ms]" />
              </div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Listening</span>
            </div>
            <p className="text-white/80 text-[11px] italic leading-tight">
              {lastCommand ? `"${lastCommand}"` : "Awaiting command..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsListening(!isListening)}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-2 ${
          isListening 
          ? 'bg-cyan-500 border-white text-black shadow-[0_0_20px_#06b6d4]' 
          : 'bg-zinc-950 border-cyan-900/50 text-cyan-500'
        }`}
      >
        {isListening ? (
          <Mic size={28} className="animate-pulse" />
        ) : (
          <MicOff size={28} className="opacity-50" />
        )}
      </motion.button>
    </div>
  );
};

export default GlobalVoiceAssistant;