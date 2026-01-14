import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Wand2, Type, Music4, Sparkles, Repeat, BarChart3, 
  Play, Pause, Plus, X, Sparkle, AudioLines, Palette, Users, 
  LineChart, FastForward, Info, LayoutTemplate, MoreHorizontal
} from 'lucide-react';

const ReelsEditor = () => {
  // --- ENGINE STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('clip');
  const [showSubMenu, setShowSubMenu] = useState(null); 
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const totalDuration = 30.00; // ৩০ সেকেন্ডের প্রফেশনাল রিল টাইমলাইন

  // --- PLAYHEAD LOGIC (The Heart of the Editor) ---
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.05;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const editTools = [
    { id: 'clip', icon: <Scissors size={20} />, label: 'Cut', color: 'bg-blue-600' },
    { id: 'ai', icon: <Wand2 size={20} />, label: 'AI Sync', color: 'bg-purple-600' },
    { id: 'text', icon: <Type size={20} />, label: 'Text', color: 'bg-yellow-500' },
    { id: 'sound', icon: <Music4 size={20} />, label: 'Beats', color: 'bg-pink-500' },
    { id: 'fx', icon: <Sparkles size={20} />, label: 'FX', color: 'bg-cyan-500' },
    { id: 'color', icon: <Palette size={20} />, label: 'Grade', color: 'bg-orange-500' },
    { id: 'analytics', icon: <LineChart size={20} />, label: 'Viral', color: 'bg-emerald-500' },
  ];

  const handleExport = () => {
    setIsExporting(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setExportProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => { setIsExporting(false); setExportProgress(0); }, 800);
      }
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden text-white font-sans select-none">
      
      {/* --- TOP HUD (Analytics & Export) --- */}
      <div className="relative z-[100] p-4 flex justify-between items-center bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-xl">
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-[9px] font-black uppercase tracking-tighter">98% Viral Potential</span>
          </div>
        </div>
        <button 
          onClick={handleExport} 
          className="relative z-[110] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2 rounded-full font-black text-[10px] shadow-2xl active:scale-95 transition-all"
        >
          EXPORT 4K
        </button>
      </div>

      {/* --- MAIN ENGINE (Preview & Right Sidebar) --- */}
      <div className="flex-1 flex flex-row relative overflow-hidden">
        
        {/* PREVIEW CONTAINER */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          <div className="w-full max-w-[280px] aspect-[9/16] bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden relative group">
             
             {/* Fake Video Canvas */}
             <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <motion.div 
                  animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="z-10 bg-yellow-400 text-black px-4 py-2 font-black italic text-xl uppercase skew-x-[-10deg]"
                >
                  PREVIEW FRAME
                </motion.div>
             </div>

             {/* Frame Rate & Time Indicator */}
             <div className="absolute top-6 left-6 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-white/10 font-mono text-[8px] text-cyan-400">
               FRM: {Math.floor(currentTime * 24)} | 4K 60FPS
             </div>

             {/* Center Play Button Overlay */}
             <button 
               onClick={() => setIsPlaying(!isPlaying)}
               className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
             >
               <div className="p-5 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl">
                 {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
               </div>
             </button>
          </div>
        </div>

        {/* --- PRO VERTICAL TOOLBAR (Right Side) --- */}
        <div className="w-20 bg-black/40 border-l border-white/5 flex flex-col items-center py-6 gap-6 overflow-y-auto hide-scrollbar z-[50]">
          {editTools.map((tool) => (
            <button 
              key={tool.id} 
              onClick={() => { setActiveTab(tool.id); setShowSubMenu(tool.id); }} 
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tool.id ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className={`p-3.5 rounded-2xl ${activeTab === tool.id ? `${tool.color} shadow-lg shadow-white/10` : 'bg-zinc-900'}`}>
                {tool.icon}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest">{tool.label}</span>
            </button>
          ))}
          <div className="mt-auto p-3 bg-white/5 rounded-full"><MoreHorizontal size={16}/></div>
        </div>
      </div>

      {/* --- PRECISION TIMELINE ENGINE --- */}
      <div className="relative z-[100] bg-[#080808] border-t border-white/10 p-5 pb-10">
        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center gap-4">
              <span className="text-xl font-mono font-bold text-white tracking-tighter">
                00:{currentTime.toFixed(2).padStart(5, '0')}
              </span>
              <span className="text-zinc-600 text-[10px] font-bold">/ 00:30:00</span>
           </div>
           <div className="flex gap-4">
              <Plus size={18} className="text-cyan-400 cursor-pointer" />
              <RotateCcw size={18} className="text-zinc-500 cursor-pointer" onClick={() => setCurrentTime(0)} />
           </div>
        </div>

        {/* Timeline Tracks Area */}
        <div className="relative h-24 bg-black rounded-xl border border-white/5 overflow-hidden">
          
          {/* Vertical Playhead (Red Line) */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 shadow-[0_0_10px_rgba(239,68,68,0.8)] pointer-events-none"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          />

          {/* Track 1: Video Clip */}
          <div className="absolute top-2 left-[10%] w-[70%] h-8 bg-blue-600/20 border-x-4 border-blue-500 rounded-lg flex items-center px-3 group">
             <div className="w-full h-[1px] bg-blue-500/20" />
             <span className="absolute left-3 text-[8px] font-black uppercase opacity-60">Main_Sequence.mp4</span>
          </div>

          {/* Track 2: Audio Waveform */}
          <div className="absolute top-12 left-0 w-full h-8 flex items-center px-4 gap-[2px]">
             {[...Array(40)].map((_, i) => (
               <div key={i} className="flex-1 bg-pink-500/30 rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
             ))}
             {/* Beat Markers */}
             <div className="absolute left-[30%] w-1.5 h-1.5 bg-white rounded-full" />
             <div className="absolute left-[60%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
          </div>
        </div>
      </div>

      {/* --- SUB-MENU (CapCut Style) --- */}
      <AnimatePresence>
        {showSubMenu && (
          <div className="fixed inset-0 z-[200]">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowSubMenu(null)} 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] rounded-t-[3rem] p-8 border-t border-white/10 shadow-2xl max-h-[60vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                   <Sparkle className="text-cyan-400" size={20} /> {showSubMenu} Studio
                </h3>
                <button onClick={() => setShowSubMenu(null)} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
              </div>

              {showSubMenu === 'ai' ? (
                <div className="space-y-4">
                  <div className="p-5 bg-purple-600/10 border border-purple-500/30 rounded-[2rem] flex items-center justify-between">
                     <div>
                        <h4 className="text-[12px] font-black uppercase">Auto-Sync to Beats</h4>
                        <p className="text-[8px] text-zinc-500 mt-1">AI analyzing waveform patterns...</p>
                     </div>
                     <div className="flex gap-1">
                        {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />)}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['Neural Slow-Mo', 'AI Upscale', 'Smart Cut', 'Sky Swap'].map(t => (
                      <button key={t} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black uppercase hover:bg-white/10">{t}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {['Precision Edit', 'Smart Filter', 'Color Grading', 'Motion Blur'].map(t => (
                    <button key={t} className="p-5 bg-white/5 border border-white/5 rounded-3xl text-[10px] font-black uppercase text-center hover:bg-white/10 active:scale-95 transition-all">
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setShowSubMenu(null)} 
                className="w-full mt-10 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
              >
                Render Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXPORT LOADING (High-End) --- */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center p-10"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-cyan-500 rounded-full shadow-[0_0_50px_rgba(6,182,212,0.3)]" 
              />
              <div className="text-center">
                <h1 className="text-6xl font-black italic tracking-tighter">{exportProgress}%</h1>
                <p className="text-[10px] font-black text-cyan-400 tracking-[0.5em] uppercase mt-2">Baking Excellence</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ReelsEditor;