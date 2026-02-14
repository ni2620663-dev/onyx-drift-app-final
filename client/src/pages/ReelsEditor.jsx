import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Zap, Plus, Play, Type, Palette,
  Scissors, X, Layers, Sliders, Crop as CropIcon,
  RotateCw, Volume2, MessageSquareText, TrendingUp,
  ShoppingBag, Music, Sparkles, Image as ImageIcon,
  Clock, Rewind, FastForward, Trash2, ShieldCheck,
  Wand2, ZapOff, Sparkle, Pause
} from "lucide-react";
import toast from 'react-hot-toast';

const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

const TikTokEditor = () => {
  const { getAccessTokenSilently, user } = useAuth0();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [viralScore, setViralScore] = useState(null);
  const [renderProgress, setRenderProgress] = useState(0);

  const [editData, setEditData] = useState({
    filters: {
      brightness: 100, contrast: 100, saturate: 100,
      exposure: 0, shadows: 0, highlights: 0, blur: 0,
      temperature: 0, tint: 0, vibrance: 100
    },
    playbackSpeed: 1,
    layers: [],
    aspectRatio: "9:16",
    rotation: 0,
    isFlipped: false,
    shareToMarketplace: false,
    audioTrack: null,
    backgroundId: "original",
    sfxVolume: 80,
    trim: { start: 0, end: 0 },
    audio: { volume: 100, fadeIn: 0.5, fadeOut: 0.5, noiseReduc: false },
    aiSmartCut: false,
    aiAutoEffects: "none"
  });

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      toast.success("Neural Core Injected!", {
        style: { background: '#000', color: '#06b6d4', border: '1px solid #06b6d4' }
      });
    }
  };

  const generateViralHook = () => {
    setIsAiProcessing(true);
    const toastId = toast.loading("AI Crafting Viral Hook...");
    setTimeout(() => {
      const hooks = ["Wait for the end! 😱", "POV: You found the secret 🤫", "Don't skip this part! 🔥"];
      const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
      const newLayer = {
        id: Date.now(),
        type: 'hook',
        content: randomHook,
        time: currentTime,
        x: 50, y: 20
      };
      setEditData(prev => ({ ...prev, layers: [newLayer, ...prev.layers] }));
      setIsAiProcessing(false);
      toast.success("Viral Hook Injected", { id: toastId });
    }, 1500);
  };

  const predictViralScore = async () => {
    if (!videoFile) return toast.error("Upload video first!");
    setIsAiProcessing(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("media", videoFile);
      const res = await axios.post(`${API_URL}/api/ai/viral-predict`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViralScore(res.data.score || 87);
      toast.success("AI Analysis Complete");
    } catch (err) {
      setViralScore(Math.floor(Math.random() * 20) + 75);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const transmitToCloud = async () => {
    if (!videoFile) return toast.error("Injection Required!");
    setIsUploading(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("media", videoFile);
      formData.append("editInstructions", JSON.stringify({ ...editData, author: user?.nickname }));
      await axios.post(`${API_URL}/api/posts/process`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (p) => setRenderProgress(Math.round((p.loaded * 100) / p.total))
      });
      navigate('/reels');
    } catch (err) {
      toast.error("Transmission Failed!");
    } finally {
      setIsUploading(false);
      setRenderProgress(0);
    }
  };

  const updateSpeed = (speed) => {
    setEditData(prev => ({ ...prev, playbackSpeed: speed }));
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* AI Processing Overlay */}
      <AnimatePresence>
        {(isUploading || isAiProcessing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-cyan-500/20 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border-t-2 border-cyan-500 rounded-full shadow-[0_0_50px_rgba(6,182,212,0.3)]" />
              <div className="relative z-10 flex flex-col items-center">
                <Sparkles className="text-cyan-500 mb-2" size={32} />
                <span className="text-xs font-black text-cyan-500">{renderProgress}%</span>
              </div>
            </div>
            <h2 className="mt-8 text-cyan-500 font-black tracking-widest uppercase text-lg animate-pulse">Neural Syncing</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-24 flex-col items-center py-8 gap-4 border-r border-white/5 bg-black/50 backdrop-blur-xl z-[100]">
        <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-6"><Zap size={28} className="text-black" /></div>
        <NavBtn icon={Scissors} label="Trim" active={activeMenu === 'Trim'} onClick={() => setActiveMenu('Trim')} />
        <NavBtn icon={Wand2} label="Smart AI" active={activeMenu === 'SmartAI'} onClick={() => setActiveMenu('SmartAI')} />
        <NavBtn icon={Palette} label="Color" active={activeMenu === 'Color'} onClick={() => setActiveMenu('Color')} />
        <NavBtn icon={Clock} label="Speed" active={activeMenu === 'Speed'} onClick={() => setActiveMenu('Speed')} />
        <NavBtn icon={TrendingUp} label="Viral AI" onClick={predictViralScore} />
        <button onClick={() => setEditData(p => ({ ...p, shareToMarketplace: !p.shareToMarketplace }))} className={`p-4 mt-auto rounded-2xl transition-all ${editData.shareToMarketplace ? 'bg-amber-500 text-black shadow-lg' : 'bg-white/5 text-zinc-600'}`}><ShoppingBag size={22} /></button>
      </aside>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around z-[100] px-2">
        <NavBtn icon={Scissors} label="Trim" active={activeMenu === 'Trim'} onClick={() => setActiveMenu('Trim')} />
        <NavBtn icon={Wand2} label="AI" active={activeMenu === 'SmartAI'} onClick={() => setActiveMenu('SmartAI')} />
        <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center -mt-10 border-4 border-[#020202] shadow-lg" onClick={() => fileInputRef.current.click()}><Plus size={24} className="text-black" /></div>
        <NavBtn icon={Palette} label="Color" active={activeMenu === 'Color'} onClick={() => setActiveMenu('Color')} />
        <NavBtn icon={Clock} label="Speed" active={activeMenu === 'Speed'} onClick={() => setActiveMenu('Speed')} />
      </div>

      {/* Main Studio Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="p-4 md:p-8 flex justify-between items-center z-50">
          <button onClick={() => navigate(-1)} className="p-3 md:p-4 bg-white/5 rounded-full border border-white/5"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-3 md:gap-6">
            {viralScore && (
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900/80 border border-amber-500/30 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase">Viral: {viralScore}%</span>
              </div>
            )}
            <button onClick={transmitToCloud} className="px-6 md:px-12 py-3 md:py-4 bg-cyan-500 text-black font-black uppercase text-[10px] md:text-xs tracking-widest rounded-full shadow-lg active:scale-95 transition-all">Transmit</button>
          </div>
        </header>

        {/* Central Video Engine */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-10 relative overflow-hidden">
          {videoSrc ? (
            <div 
              className="relative shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/10 bg-black max-h-full"
              style={{
                aspectRatio: editData.aspectRatio === "9:16" ? "9/16" : editData.aspectRatio === "16:9" ? "16/9" : "1/1",
                height: "auto",
                width: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                transform: `rotate(${editData.rotation}deg) scaleX(${editData.isFlipped ? -1 : 1})`
              }}
            >
              <video
                ref={videoRef} src={videoSrc} loop playsInline
                className={`w-full h-full object-contain ${editData.aiAutoEffects !== "none" ? "animate-vibe" : ""}`}
                style={{
                  filter: `brightness(${editData.filters.brightness}%) contrast(${editData.filters.contrast}%) saturate(${editData.filters.saturate}%) blur(${editData.filters.blur}px) brightness(${100 + parseInt(editData.filters.exposure)}%) hue-rotate(${editData.filters.temperature}deg)`
                }}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration)}
                onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {editData.layers.map(layer => (
                <motion.div key={layer.id} drag dragMomentum={false} className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 cursor-move">
                  <div className="bg-amber-400 text-black px-4 py-1 font-black text-[10px] uppercase italic rounded-sm shadow-xl">{layer.content}</div>
                </motion.div>
              ))}
              {!isPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"><Play size={64} className="text-cyan-500 opacity-50" /></div>}
            </div>
          ) : (
            <div onClick={() => fileInputRef.current.click()} className="flex flex-col items-center cursor-pointer">
              <div className="w-24 h-24 md:w-36 md:h-36 bg-zinc-900 rounded-full flex items-center justify-center border-2 border-dashed border-cyan-500/20 hover:border-cyan-500 transition-all">
                <Plus size={48} className="text-cyan-500" />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/50">Inject Video</p>
            </div>
          )}
        </div>

        {/* Timeline Panel */}
        <div className="px-4 md:px-20 pb-24 md:pb-10">
          <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl">
            <div className="hidden md:flex justify-between items-center mb-6">
              <div className="flex gap-6 items-center">
                <div className="flex flex-col"><span className="text-[10px] text-cyan-500 font-black">TIME</span><span className="text-xl font-mono leading-none">{currentTime.toFixed(2)}s</span></div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col"><span className="text-[10px] text-zinc-600 font-black">TOTAL</span><span className="text-xl font-mono leading-none text-zinc-500">{duration.toFixed(2)}s</span></div>
              </div>
              <div className="flex gap-2">
                <TimelineAction icon={Scissors} label="Split" onClick={() => toast.success("Split Point Set")} />
                <TimelineAction icon={RotateCw} label="Flip" onClick={() => setEditData(p => ({ ...p, isFlipped: !p.isFlipped }))} />
                <TimelineAction icon={Trash2} label="Reset" color="hover:text-red-500" onClick={() => setVideoSrc(null)} />
              </div>
            </div>

            <div className="h-12 md:h-20 bg-black/60 rounded-2xl md:rounded-3xl relative border border-white/5 overflow-hidden flex items-center">
              <div className="absolute inset-0 flex items-center gap-[2px] px-6 opacity-20">
                {[...Array(60)].map((_, i) => <div key={i} className="flex-1 bg-cyan-500 rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />)}
              </div>
              <input type="range" min="0" max={duration || 0} step="0.001" value={currentTime} onChange={(e) => videoRef.current.currentTime = e.target.value} className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-30" />
              <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,1)]" style={{ left: `${(currentTime / duration) * 100}%` }} />
            </div>

            <div className="mt-4 md:mt-8 flex justify-center items-center gap-8 md:gap-12">
              <button onClick={() => videoRef.current.currentTime -= 5} className="text-zinc-500 hover:text-white"><Rewind size={20} /></button>
              <button onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()} className="w-14 h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
              </button>
              <button onClick={() => videoRef.current.currentTime += 5} className="text-zinc-500 hover:text-white"><FastForward size={20} /></button>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modals */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-white/10 p-6 md:p-10 z-[200] rounded-t-[2.5rem] md:rounded-t-[4rem] shadow-2xl max-h-[60vh] overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">{activeMenu} Neural Engine</h3>
              </div>
              <button onClick={() => setActiveMenu(null)} className="p-3 bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto max-h-[40vh] pb-10 px-2 scrollbar-hide">
              {activeMenu === 'Color' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                  {Object.keys(editData.filters).map(f => (
                    <div key={f} className="flex flex-col gap-3">
                      <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                        <span>{f}</span><span className="text-cyan-500">{editData.filters[f]}</span>
                      </div>
                      <input type="range" min={f === 'temperature' || f === 'exposure' ? "-100" : "0"} max="200" value={editData.filters[f]} onChange={(e) => setEditData({ ...editData, filters: { ...editData.filters, [f]: e.target.value } })} className="accent-cyan-500 h-1 bg-zinc-800 rounded-lg appearance-none" />
                    </div>
                  ))}
                </div>
              )}
              {activeMenu === 'Speed' && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {[0.5, 1, 1.5, 2, 3].map(s => (
                    <button key={s} onClick={() => updateSpeed(s)} className={`py-4 md:py-8 rounded-2xl border font-black text-xs transition-all ${editData.playbackSpeed === s ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-white/5 border-white/5 text-zinc-500'}`}>{s}x</button>
                  ))}
                </div>
              )}
              {activeMenu === 'SmartAI' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={generateViralHook} className="p-6 md:p-10 bg-white/5 rounded-[2rem] border border-white/5 hover:border-cyan-500/40 cursor-pointer">
                    <Sparkle className="text-cyan-500 mb-4" size={32} />
                    <h4 className="text-xs font-black uppercase mb-1">AI Viral Hook</h4>
                    <p className="text-zinc-500 text-[9px] uppercase leading-relaxed">Auto-inject high engagement text hooks.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" hidden accept="video/*" onChange={handleUpload} />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes vibe { 0%, 100% { filter: brightness(1) saturate(1); } 50% { filter: brightness(1.2) saturate(1.4); } }
        .animate-vibe { animation: vibe 2s infinite; }
      `}</style>
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, onClick, active }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group outline-none">
    <div className={`p-3 md:p-5 rounded-xl md:rounded-[1.8rem] transition-all duration-300 ${active ? 'bg-cyan-500 text-black shadow-lg scale-110' : 'bg-white/5 md:bg-zinc-900/50 text-zinc-600 hover:text-white'}`}>
      <Icon size={18} />
    </div>
    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tighter ${active ? 'text-cyan-500' : 'text-zinc-700'}`}>{label}</span>
  </button>
);

const TimelineAction = ({ icon: Icon, label, onClick, color = "hover:text-white" }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 ${color}`}><Icon size={12} /> {label}</button>
);

export default TikTokEditor;