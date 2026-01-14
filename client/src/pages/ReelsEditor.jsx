import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Wand2, Type, Music4, Sparkles, Repeat, BarChart3, 
  Play, Pause, Plus, X, Sparkle, AudioLines, Palette, Users, 
  LineChart, FastForward, Info, LayoutTemplate, MoreHorizontal,
  RotateCcw, Upload, Volume2
} from 'lucide-react';

const ReelsEditor = () => {
  // --- ENGINE STATES ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('clip');
  const [showSubMenu, setShowSubMenu] = useState(null); 
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // --- VIDEO & EDITING STATES ---
  const [videoSrc, setVideoSrc] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null); // অডিওর জন্য
  const [overlayText, setOverlayText] = useState("VIRAL HOOK ⚡"); // টেক্সট এর জন্য
  const [filter, setFilter] = useState('none');
  const [trimStart, setTrimStart] = useState(0);

  const videoRef = useRef(null);
  const audioRef = useRef(null); // অডিও রেফারেন্স
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null); // অডিও ফাইল ইনপুট
  
  const totalDuration = 30.00;

  // --- VIDEO UPLOAD HANDLER ---
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // --- AUDIO UPLOAD HANDLER ---
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioSrc(URL.createObjectURL(file));
    }
  };

  // --- SYNC PLAYHEAD LOGIC ---
  useEffect(() => {
    let interval;
    if (isPlaying) {
      if (videoRef.current) videoRef.current.play();
      if (audioRef.current) audioRef.current.play();
      
      interval = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          if (videoRef.current.ended) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }
      }, 50);
    } else {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
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
      p += 5;
      setExportProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => { setIsExporting(false); setExportProgress(0); }, 800);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden text-white font-sans select-none">
      
      {/* TOP HUD */}
      <div className="relative z-[100] p-4 flex justify-between items-center bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-xl">
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-[9px] font-black uppercase tracking-tighter">98% Retention</span>
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 rounded-2xl border border-white/10 transition-all"
          >
            <Upload size={14} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Upload Video</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleVideoUpload} accept="video/*" className="hidden" />
          <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />
        </div>
        <button 
          onClick={handleExport} 
          className="relative z-[110] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2 rounded-full font-black text-[10px] shadow-2xl active:scale-95 transition-all"
        >
          EXPORT 4K
        </button>
      </div>

      {/* MAIN ENGINE */}
      <div className="flex-1 flex flex-row relative overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center p-4">
          <div className="w-full max-w-[300px] aspect-[9/16] bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden relative group">
             
             {/* Preview Surface */}
             <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                {videoSrc ? (
                  <video 
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full object-cover"
                    style={{ filter: filter }}
                  />
                ) : (
                  <div className="text-zinc-600 font-black text-[10px] tracking-widest uppercase">No Media Selected</div>
                )}

                {/* Text Overlay */}
                <motion.div 
                  animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute z-20 bg-yellow-400 text-black px-6 py-2 font-black italic text-2xl uppercase skew-x-[-12deg] shadow-2xl"
                >
                  {overlayText}
                </motion.div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,transparent_20%,black_150%)] pointer-events-none opacity-50" />
             </div>

             {/* Play Overlay */}
             <div className="absolute inset-0 z-30 flex items-center justify-center">
               <button 
                 onClick={() => videoSrc && setIsPlaying(!isPlaying)}
                 className={`p-6 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl transition-all duration-300 ${isPlaying ? 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100' : 'opacity-100 scale-100'}`}
               >
                 {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
               </button>
             </div>

             {/* Hidden Audio Element */}
             {audioSrc && <audio ref={audioRef} src={audioSrc} />}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-20 bg-black/60 border-l border-white/5 flex flex-col items-center py-8 gap-8 overflow-y-auto hide-scrollbar z-[150]">
          {editTools.map((tool) => (
            <button 
              key={tool.id} 
              onClick={() => { setActiveTab(tool.id); setShowSubMenu(tool.label); }} 
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === tool.id ? 'scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
            >
              <div className={`p-4 rounded-2xl transition-shadow ${activeTab === tool.id ? `${tool.color} shadow-[0_0_20px_rgba(255,255,255,0.2)]` : 'bg-zinc-900 hover:bg-zinc-800'}`}>
                {React.cloneElement(tool.icon, { size: 22, className: "text-white" })}
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="relative z-[100] bg-[#080808] border-t border-white/10 p-6 pb-12">
        <div className="flex justify-between items-center mb-5">
           <div className="flex items-center gap-4">
              <span className="text-2xl font-mono font-bold text-white tracking-tighter w-24">
                00:{currentTime.toFixed(2).padStart(5, '0')}
              </span>
              <div className="h-4 w-[1px] bg-white/10" />
              <span className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">00:30:00</span>
           </div>
           <RotateCcw size={20} className="text-zinc-500 cursor-pointer" onClick={() => { if(videoRef.current) videoRef.current.currentTime = 0; }} />
        </div>

        <div className="relative h-20 bg-black/50 rounded-2xl border border-white/5 overflow-hidden">
          <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 shadow-[0_0_15px_red]" style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
          <div className="absolute top-2 left-0 w-full h-7 bg-blue-600/10 border-y border-blue-500/30 flex items-center px-4">
             <span className="text-[7px] font-black uppercase opacity-40">Main_Video_Track</span>
          </div>
          <div className={`absolute top-11 left-0 w-full h-7 flex items-center px-4 gap-[1.5px] ${audioSrc ? 'bg-pink-500/10 border-y border-pink-500/20' : ''}`}>
             {[...Array(60)].map((_, i) => (
               <div key={i} className={`flex-1 rounded-full ${audioSrc ? 'bg-pink-500' : 'bg-white/5'}`} style={{ height: `${Math.random() * 80 + 20}%` }} />
             ))}
          </div>
        </div>
      </div>

      {/* SUB-MENU ENGINE */}
      <AnimatePresence>
        {showSubMenu && (
          <div className="fixed inset-0 z-[250] flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSubMenu(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="relative w-full bg-[#0f0f0f] rounded-t-[3.5rem] p-10 border-t border-white/10 max-h-[70vh] overflow-y-auto">
              
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Sparkle className="text-cyan-400" /> {showSubMenu} Studio
                </h3>
                <button onClick={() => setShowSubMenu(null)} className="p-3 bg-white/5 rounded-full"><X size={24}/></button>
              </div>

              {/* Sub Menu Dynamic Logic */}
              {showSubMenu === 'Text' ? (
                <div className="space-y-6">
                  <input 
                    type="text" 
                    value={overlayText} 
                    onChange={(e) => setOverlayText(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xl font-black italic outline-none focus:border-yellow-400"
                    placeholder="ENTER TEXT..."
                  />
                  <p className="text-[10px] text-zinc-500 uppercase font-black">Edit directly on the preview screen above</p>
                </div>
              ) : showSubMenu === 'Beats' ? (
                <div className="space-y-6 text-center">
                  <button 
                    onClick={() => audioInputRef.current.click()}
                    className="w-full p-10 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center gap-4 hover:bg-pink-500/5 transition-all"
                  >
                    <Music4 size={48} className="text-pink-500" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      {audioSrc ? 'Change Soundtrack' : 'Upload Audio File'}
                    </span>
                  </button>
                  {audioSrc && <div className="text-pink-500 flex items-center justify-center gap-2 animate-pulse font-black text-[10px]"><Volume2 size={16}/> AUDIO LOADED</div>}
                </div>
              ) : showSubMenu === 'Grade' ? (
                <div className="grid grid-cols-3 gap-4">
                  {[{name: 'None', val: 'none'}, {name: 'Retro', val: 'sepia(0.8)'}, {name: 'B&W', val: 'grayscale(1)'}, {name: 'Cinematic', val: 'contrast(1.5) brightness(0.8)'}].map(f => (
                    <button key={f.name} onClick={() => setFilter(f.val)} className={`p-4 rounded-2xl border ${filter === f.val ? 'border-orange-500 bg-orange-500/10' : 'border-white/5'} text-[9px] font-black uppercase`}>{f.name}</button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {['Precision Cut', 'Split', 'AI Enhance', 'Upscale'].map(t => (
                    <button key={t} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] text-xs font-black uppercase hover:bg-white/10">{t}</button>
                  ))}
                </div>
              )}

              <button onClick={() => setShowSubMenu(null)} className="w-full mt-10 bg-white text-black py-6 rounded-3xl font-black uppercase tracking-[0.4em]">Save Changes</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXPORT SCREEN */}
      <AnimatePresence>
        {isExporting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-64 h-64 border-t-2 border-cyan-500 rounded-full shadow-[0_0_60px_rgba(6,182,212,0.4)] absolute" />
            <h1 className="text-7xl font-black italic tracking-tighter z-10">{exportProgress}%</h1>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .inner-shadow { box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};

export default ReelsEditor;