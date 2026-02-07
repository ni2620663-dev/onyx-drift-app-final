// components/InheritorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGhost, FaCommentDots, FaLockOpen, FaMicrophone, FaHistory } from 'react-icons/fa';

const InheritorDashboard = ({ originalUserName, neuralData }) => {
  const [messages, setMessages] = useState([
    { role: 'twin', text: `Hello. I am the digital echo of ${originalUserName}. I have been waiting for you.` }
  ]);
  const [inputText, setInputText] = useState("");

  const handleConversation = () => {
    if(!inputText.trim()) return;
    
    const userMsg = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    // AI Twin Response Logic (Simulated)
    setTimeout(() => {
      const twinReply = { 
        role: 'twin', 
        text: `Based on ${originalUserName}'s patterns, I think they would say: "Don't be sad. A part of me is always here in the mesh."` 
      };
      setMessages(prev => [...prev, twinReply]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white p-6 font-sans">
      {/* Header: The Resonance Status */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-20 h-20 bg-purple-500/10 border border-purple-500/40 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
        >
          <FaGhost className="text-purple-500 text-3xl" />
        </motion.div>
        <h1 className="text-2xl font-black tracking-[0.3em] uppercase underline-offset-8 decoration-purple-500 underline">
          Shadow Link Active
        </h1>
        <p className="text-[10px] text-zinc-500 mt-4 tracking-widest font-mono">
          Accessing Neural Legacy of: <span className="text-purple-400">{originalUserName}</span>
        </p>
      </div>

      {/* Chat Interface: Talking to the Twin */}
      <div className="max-w-xl mx-auto bg-white/[0.02] border border-white/5 rounded-[40px] p-6 h-[500px] flex flex-col shadow-2xl backdrop-blur-md">
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar p-2">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${
                msg.role === 'user' 
                ? 'bg-purple-600 text-white rounded-tr-none' 
                : 'bg-white/5 text-zinc-300 border border-white/10 rounded-tl-none font-mono italic'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interaction Bar */}
        <div className="mt-4 flex gap-2">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConversation()}
            placeholder="Ask the Twin something..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-purple-500/50 transition-all text-sm"
          />
          <button 
            onClick={handleConversation}
            className="bg-purple-500 text-white p-4 rounded-2xl hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20"
          >
            <FaCommentDots />
          </button>
        </div>
      </div>

      {/* Legacy Vault Media Access */}
      <div className="max-w-xl mx-auto mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group text-center">
            <FaHistory className="mx-auto mb-2 text-zinc-500 group-hover:text-purple-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Memories</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group text-center">
            <FaMicrophone className="mx-auto mb-2 text-zinc-500 group-hover:text-cyan-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Voice Logs</p>
        </div>
      </div>
    </div>
  );
};

export default InheritorDashboard;