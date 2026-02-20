import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaRobot, FaBrain, FaZap, FaFingerprint } from 'react-icons/fa';

const AiChat = ({ twinName, twinAvatar }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: `Greetings. I am ${twinName}'s Digital Twin. My neural sync is currently at 94%. How can I assist your curiosity?`, sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages([...messages, userMsg]);
    setInput('');
    setIsTyping(true);

    // --- AI Response Simulation ---
    setTimeout(() => {
      const aiMsg = { 
        id: Date.now() + 1, 
        text: "Analyzing neural patterns... Based on my host's previous interactions, the answer would be: 'Progress is the only constant.' ✨", 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-lg mx-auto bg-[#050508]/80 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
      
      {/* --- Chat Header --- */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={twinAvatar || "https://i.pravatar.cc/150?u=ai"} className="w-12 h-12 rounded-2xl object-cover border border-cyan-500/50" alt="Twin" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-[#050508] flex items-center justify-center">
              <FaZap size={8} className="text-black" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase italic tracking-widest text-white">{twinName}'s Soul</h3>
            <p className="text-[8px] text-cyan-400 font-bold uppercase tracking-tighter animate-pulse">Neural Link: Active</p>
          </div>
        </div>
        <FaFingerprint className="text-zinc-700" size={20} />
      </div>

      {/* --- Chat Messages --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm ${
              msg.sender === 'user' 
              ? 'bg-cyan-600/20 border border-cyan-500/30 text-white rounded-tr-none' 
              : 'bg-zinc-900/80 border border-white/5 text-zinc-300 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-900/80 p-4 rounded-full space-x-1 flex">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 h-1 bg-cyan-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-cyan-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-cyan-500 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* --- Input Field --- */}
      <form onSubmit={handleSendMessage} className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pulse a thought..." 
          className="flex-1 bg-black/40 border border-white/10 rounded-full px-6 py-3 text-xs outline-none focus:border-cyan-500 transition-all text-white"
        />
        <button className="p-4 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-full text-white hover:scale-105 transition-all shadow-lg shadow-cyan-500/20">
          <FaPaperPlane size={14} />
        </button>
      </form>
    </div>
  );
};

export default AiChat;