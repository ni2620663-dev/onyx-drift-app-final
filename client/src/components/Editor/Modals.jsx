import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkle, Zap, Dna, Tv, Mic, Send, Sparkles } from "lucide-react";
import toast from 'react-hot-toast';

const Modals = ({ 
  activeMenu, 
  setActiveMenu, 
  editData, 
  setEditData, 
  updateSpeed, 
  generateViralHook, 
  addSticker,
  generateVoiceover 
}) => {
  const [ttsText, setTtsText] = useState("");

  const applyNeuralStyle = (styleId) => {
    let newFilters = { ...editData.filters };
    if (styleId === 'cinematic') {
      newFilters = { ...newFilters, contrast: 140, brightness: 105, saturate: 110 };
    } else if (styleId === 'cyberpunk') {
      newFilters = { ...newFilters, temperature: -30, saturate: 160, contrast: 125 };
    } else if (styleId === 'horror') {
      newFilters = { ...newFilters, saturate: 10, contrast: 160, brightness: 85 };
    } else if (styleId === 'vintage') {
      newFilters = { ...newFilters, temperature: 35, saturate: 60, contrast: 95 };
    }
    setEditData({ ...editData, filters: newFilters });
    toast.success(`${styleId.toUpperCase()} style synced!`);
  };

  if (!activeMenu) return null;

  const stickers = ['🔥', '✨', '😂', '🚀', '💯', '💥', '💀', '🤖', '👑', '💎', '❤️', '⚡'];

  return (
    <AnimatePresence>
      {activeMenu && (
        <motion.div 
          initial={{ y: "100%", opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-[#080808] border-t border-white/10 p-5 md:p-10 z-[10000] rounded-t-[2rem] md:rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] h-fit max-h-[90vh] flex flex-col"
        >
          {/* Mobile Handle Bar */}
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 md:hidden" />

          {/* Header */}
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400">
                {activeMenu} <span className="text-white">Neural Engine</span>
              </h3>
            </div>
            <button 
              onClick={() => setActiveMenu(null)} 
              className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto pb-12 px-1 scrollbar-hide flex-1">
            
            {/* 1. Color Grading - স্লাইডারগুলো মোবাইলে বড় করা হয়েছে */}
            {activeMenu === 'Color' && (
              <div className="grid grid-cols-1 gap-6">
                {Object.keys(editData.filters).map(f => (
                  <div key={f} className="flex flex-col gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-zinc-500">{f}</span>
                      <span className="text-cyan-500 font-mono">{editData.filters[f]}</span>
                    </div>
                    <input 
                      type="range" 
                      min={f === 'temperature' || f === 'exposure' ? "-100" : "0"} 
                      max="200" 
                      value={editData.filters[f]} 
                      onChange={(e) => setEditData({ ...editData, filters: { ...editData.filters, [f]: e.target.value } })} 
                      className="accent-cyan-500 h-1.5 w-full bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 2. Playback Speed */}
            {activeMenu === 'Speed' && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[0.5, 1, 1.5, 2, 3].map(s => (
                  <button 
                    key={s} 
                    onClick={() => updateSpeed(s)} 
                    className={`py-4 md:py-8 rounded-2xl border font-black text-sm transition-all active:scale-95 ${editData.playbackSpeed === s ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}

            {/* 3. Smart AI - মোবাইল কার্ড অপ্টিমাইজেশন */}
            {activeMenu === 'SmartAI' && (
              <div className="flex flex-col gap-6">
                {/* Neural Style Grid */}
                <div className="p-5 bg-cyan-500/5 border border-cyan-500/10 rounded-[2rem]">
                  <h4 className="text-cyan-500 text-[9px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={12} /> Neural Emotion Sync
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cinematic', label: 'Epic', icon: '🎬', desc: 'Dramatic' },
                      { id: 'cyberpunk', label: 'Neon', icon: '🌌', desc: 'Cyber' },
                      { id: 'horror', label: 'Dark', icon: '💀', desc: 'Grainy' },
                      { id: 'vintage', label: 'Retro', icon: '🎞️', desc: 'Warm' }
                    ].map((style) => (
                      <button 
                        key={style.id}
                        onClick={() => applyNeuralStyle(style.id)}
                        className="flex flex-col items-start p-3 bg-zinc-900/80 rounded-xl border border-white/5 active:bg-cyan-500/20 transition-all"
                      >
                        <span className="text-xl mb-1">{style.icon}</span>
                        <span className="text-[10px] font-black uppercase text-white">{style.label}</span>
                        <span className="text-[8px] text-zinc-500 font-bold">{style.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Voiceover */}
                <div className="bg-zinc-900 p-5 rounded-[2rem] border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Mic size={14} className="text-purple-500" />
                    <h4 className="text-[9px] font-black uppercase text-zinc-400">AI Voice Synthesis</h4>
                  </div>
                  <div className="flex flex-col gap-3">
                    <textarea 
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Script for AI..."
                      className="bg-black/50 border border-white/5 rounded-xl p-4 text-xs outline-none focus:border-purple-500/50 min-h-[100px]"
                    />
                    <button 
                      onClick={() => {
                        generateVoiceover(ttsText);
                        setTtsText("");
                      }}
                      className="bg-purple-600 text-white py-4 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Send size={14} /> Generate Neural Voice
                    </button>
                  </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={generateViralHook} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2 active:bg-white/10">
                    <Sparkle className="text-cyan-400" size={20} />
                    <span className="text-[9px] font-black uppercase">Viral Hook</span>
                  </div>
                  <div 
                    onClick={() => setEditData(p => ({ ...p, aiAutoEffects: p.aiAutoEffects === 'glitch' ? 'none' : 'glitch' }))}
                    className={`p-5 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${editData.aiAutoEffects === 'glitch' ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/5'}`}
                  >
                    <Dna className="text-purple-500" size={20} />
                    <span className="text-[9px] font-black uppercase">Glitch AI</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modals;