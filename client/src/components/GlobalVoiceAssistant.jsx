import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GlobalVoiceAssistant = ({ user }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const recognitionRef = useRef(null);

  // AI Voice Response (Text-to-Speech)
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const executeCommand = useCallback((command) => {
    const cmd = command.toLowerCase();
    setLastCommand(command);

    // 1. App Navigation
    if (cmd.includes("open home") || cmd.includes("feed")) navigate("/feed");
    if (cmd.includes("messages") || cmd.includes("chat")) navigate("/messages");
    if (cmd.includes("profile")) navigate(`/profile/${user?.sub}`);
    if (cmd.includes("open reels")) navigate("/reels");

    // 2. Chat & Messaging (Conceptual)
    if (cmd.includes("send message to")) {
      const name = cmd.split("to")[1];
      speak(`Opening chat with ${name}`);
      navigate(`/messages?search=${name.trim()}`);
    }

    // 3. Reels & Video Control
    if (cmd.includes("next") || cmd.includes("scroll down")) {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
    if (cmd.includes("back") || cmd.includes("scroll up")) {
      window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
    }
    if (cmd.includes("pause")) document.querySelectorAll('video').forEach(v => v.pause());
    if (cmd.includes("play")) document.querySelectorAll('video').forEach(v => v.play());

    // 4. Voice Interaction (Like/Post)
    if (cmd.includes("like this")) {
      const likeBtn = document.querySelector('[aria-label="like"]') || document.querySelector('.heart-icon');
      likeBtn?.click();
      toast.success("Liked via Voice Command");
    }
    if (cmd.includes("create new post")) {
        speak("Opening Uplink Terminal");
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn?.click();
    }

    // 5. Search Control
    if (cmd.includes("search")) {
      const query = cmd.split("search")[1];
      speak(`Searching for ${query}`);
      navigate(`/search?q=${query.trim()}`);
    }

    // 6. Voice Call Control
    if (cmd.includes("answer call") || cmd.includes("pick up")) {
        document.getElementById("answer-call-btn")?.click();
    }
    if (cmd.includes("end call")) {
        document.getElementById("end-call-btn")?.click();
    }

    // 7. Settings & AI Assistant Features
    if (cmd.includes("dark mode")) document.documentElement.classList.add('dark');
    if (cmd.includes("light mode")) document.documentElement.classList.remove('dark');
    
    if (cmd.includes("who am i")) speak(`You are ${user?.name || 'the operator'}. Neural link is stable.`);
    if (cmd.includes("how many followers")) speak("Analyzing neural network... You have 1,240 active followers.");

  }, [navigate, user]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      executeCommand(transcript);
    };

    if (isListening) {
      recognitionRef.current.start();
      toast.success("Voice Intelligence Active", { icon: '🎙️' });
    } else {
      recognitionRef.current.stop();
    }

    return () => recognitionRef.current.stop();
  }, [isListening, executeCommand]);

  return (
    <div className="fixed bottom-24 right-6 z-[99999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/80 backdrop-blur-2xl border border-cyan-500/30 p-4 rounded-3xl shadow-2xl max-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Listening</span>
            </div>
            <p className="text-white text-xs italic line-clamp-2">"{lastCommand || "Waiting for signal..."}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsListening(!isListening)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all border-4 ${
          isListening 
          ? 'bg-cyan-500 border-cyan-300 text-black animate-pulse' 
          : 'bg-zinc-900 border-zinc-800 text-cyan-500'
        }`}
      >
        {isListening ? <Mic size={28} /> : <MicOff size={28} />}
      </motion.button>
    </div>
  );
};