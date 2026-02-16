import React, { useState } from 'react';
import { motion } from "framer-motion";
import { X, Sparkle, Zap, Dna, Tv, Smile, Mic, Layers, Send, Wand2, Sparkles } from "lucide-react";
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

  // Neural Style Application Logic
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
    toast.success(`${styleId} neural style synced!`);
  };

  if (!activeMenu) return null;

  const stickers = ['🔥', '✨', '😂', '🚀', '💯', '💥', '💀', '🤖', '👑', '💎', '❤️', '⚡'];

  return (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }} 
      className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-white/10 p-6 md:p-10 z-[200] rounded-t-[2.5rem] md:rounded-t-[4rem] shadow-2xl max-h-[70vh] overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-widest">{activeMenu} Neural Engine</h3>
        </div>
        <button onClick={() => setActiveMenu(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[50vh] pb-10 px-2 scrollbar-hide">
        
        {/* 1. Color Grading Menu */}
        {activeMenu === 'Color' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
            {Object.keys(editData.filters).map(f => (
              <div key={f} className="flex flex-col gap-3">
                <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                  <span>{f}</span><span className="text-cyan-500">{editData.filters[f]}</span>
                </div>
                <input 
                  type="range" min={f === 'temperature' || f === 'exposure' ? "-100" : "0"} max="200" 
                  value={editData.filters[f]} 
                  onChange={(e) => setEditData({ ...editData, filters: { ...editData.filters, [f]: e.target.value } })} 
                  className="accent-cyan-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                />
              </div>
            ))}
          </div>
        )}

        {/* 2. Playback Speed Menu */}
        {activeMenu === 'Speed' && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[0.5, 1, 1.5, 2, 3].map(s => (
              <button 
                key={s} 
                onClick={() => updateSpeed(s)} 
                className={`py-4 md:py-8 rounded-2xl border font-black text-xs transition-all ${editData.playbackSpeed === s ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {/* 3. Sticker Menu */}
        {activeMenu === 'Stickers' && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {stickers.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => addSticker(emoji)} 
                className="text-4xl p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* 4. Smart AI Menu */}
        {activeMenu === 'SmartAI' && (
          <div className="flex flex-col gap-10">
            {/* Neural Emotion Sync (New Style Panel) */}
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[2.5rem]">
              <h3 className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Sparkles size={14} /> Neural Emotion Sync
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: 'cinematic', label: 'Epic Narrative', icon: '🎬', desc: 'Deep shadows' },
                  { id: 'cyberpunk', label: 'Neon Soul', icon: '🌌', desc: 'Cyber glow' },
                  { id: 'horror', label: 'Dark Echo', icon: '💀', desc: 'Grainy dark' },
                  { id: 'vintage', label: 'Old Memory', icon: '🎞️', desc: 'Warm sepia' }
                ].map((style) => (
                  <button 
                    key={style.id}
                    onClick={() => applyNeuralStyle(style.id)}
                    className="flex flex-col items-start p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 transition-all group"
                  >
                    <span className="text-2xl mb-2">{style.icon}</span>
                    <span className="text-[10px] font-black uppercase text-white mb-1">{style.label}</span>
                    <span className="text-[8px] text-zinc-500 font-bold leading-tight">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Voiceover Section */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Mic size={18} className="text-purple-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">AI Neural Voiceover</h4>
              </div>
              <div className="flex gap-2">
                <textarea 
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Type script for AI voice..."
                  className="flex-1 bg-black/50 border border-white/5 rounded-2xl p-4 text-xs outline-none focus:border-purple-500/50 transition-all resize-none h-24"
                />
                <button 
                  onClick={() => {
                    generateVoiceover(ttsText);
                    setTtsText("");
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Send size={20} />
                  <span className="text-[8px] font-bold uppercase">Gen</span>
                </button>
              </div>
            </div>

            {/* AI Effects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => applyNeuralStyle('cinematic')} className="p-6 md:p-10 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-[2rem] border border-cyan-500/20 hover:border-cyan-500/60 cursor-pointer transition-all group">
                <Zap className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform" size={32} />
                <h4 className="text-xs font-black uppercase mb-1">AI Magic Enhance</h4>
                <p className="text-zinc-500 text-[9px] uppercase leading-relaxed">Auto-balance lighting & cinematic tone.</p>
              </div>

              <div 
                onClick={() => {
                  setEditData(prev => ({ ...prev, aiAutoEffects: prev.aiAutoEffects === 'glitch' ? 'none' : 'glitch' }));
                  toast.success("Neural Glitch Synced");
                }} 
                className={`p-6 md:p-10 rounded-[2rem] border transition-all cursor-pointer ${editData.aiAutoEffects === 'glitch' ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/5 hover:border-purple-500/40'}`}
              >
                <Dna className="text-purple-500 mb-4" size={32} />
                <h4 className="text-xs font-black uppercase mb-1">Neural Glitch</h4>
                <p className="text-zinc-500 text-[9px] uppercase leading-relaxed">AI digital distortion & chromatic aberration.</p>
              </div>

              <div onClick={() => applyNeuralStyle('vintage')} className="p-6 md:p-10 bg-white/5 rounded-[2rem] border border-white/5 hover:border-amber-500/40 cursor-pointer transition-all">
                <Tv className="text-amber-500 mb-4" size={32} />
                <h4 className="text-xs font-black uppercase mb-1">1990s VHS</h4>
                <p className="text-zinc-500 text-[9px] uppercase leading-relaxed">Instant retro vibe with analog textures.</p>
              </div>

              <div onClick={generateViralHook} className="p-6 md:p-10 bg-white/5 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all group">
                <Sparkle className="text-cyan-500 mb-4 group-hover:rotate-12 transition-transform" size={32} />
                <h4 className="text-xs font-black uppercase mb-1">AI Viral Hook</h4>
                <p className="text-zinc-500 text-[9px] uppercase leading-relaxed">Auto-inject high engagement text hooks.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Modals;