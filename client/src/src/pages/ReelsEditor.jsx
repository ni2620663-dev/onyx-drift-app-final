import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Plus, X, Scissors, Type, Music4, Palette,
  Sparkles, Gauge, RotateCcw, Check, Share2, Send, 
  Music, ArrowLeft, Loader2
} from "lucide-react";
import toast from 'react-hot-toast';

const TikTokEditor = () => {
  const { getAccessTokenSilently, user } = useAuth0();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null); 
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState("none");
  const [effect, setEffect] = useState("none");
  const [overlayText, setOverlayText] = useState("");
  const [menu, setMenu] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const totalDuration = 30;
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  useEffect(() => {
    let timer;
    if (isPlaying && videoSrc) {
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
      if (audioRef.current) audioRef.current.play().catch(() => {});

      timer = setInterval(() => {
        if (videoRef.current) {
          const t = videoRef.current.currentTime;
          if (t >= totalDuration) {
            videoRef.current.currentTime = 0;
          }
          setCurrentTime(t);
        }
      }, 50);
    } else {
      videoRef.current?.pause();
      audioRef.current?.pause();
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, videoSrc]);

  const uploadVideo = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB Limit
        return toast.error("Video too large! Max 50MB.");
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setCurrentTime(0);
      setTimeout(() => videoRef.current?.load(), 100);
    }
  };

  const handleNext = async () => {
    if (!videoFile) return toast.error("Please select a video first!");

    try {
      setIsUploading(true);
      const token = await getAccessTokenSilently();
      
      const formData = new FormData();
      formData.append("media", videoFile); // Backend 'media' হিসেবে রিসিভ করবে
      formData.append("text", overlayText || "Onyx Drift Neural Reel");
      formData.append("type", "reel");
      
      // Author Details যোগ করা হলো
      formData.append("authorName", user?.name || user?.nickname);
      formData.append("authorAvatar", user?.picture);

      const res = await axios.post(`${API_URL}/api/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.status === 201) {
        toast.success("Reel Transmitted Successfully!");
        navigate('/reels');
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Network sync failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const effects = {
    none: "",
    cinematic: "contrast(1.3) saturate(1.4)",
    glitch: "hue-rotate(90deg) contrast(1.4)",
    retro: "sepia(0.8) brightness(0.9)",
  };

  const tools = [
    { id: "Text", icon: <Type size={20}/> },
    { id: "Audio", icon: <Music4 size={20}/>, action: () => audioInputRef.current.click() },
    { id: "Filters", icon: <Palette size={20}/> },
    { id: "Effects", icon: <Sparkles size={20}/> },
    { id: "Speed", icon: <Gauge size={20}/> },
    { id: "Trim", icon: <Scissors size={20}/> },
  ];

  return (
    <div className="fixed inset-0 bg-black flex justify-center items-center overflow-hidden z-[5000]">
      
      <div className="relative w-full h-[100dvh] max-w-[450px] bg-black overflow-hidden flex flex-col shadow-2xl">
        
        <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={uploadVideo} />
        <input ref={audioInputRef} type="file" accept="audio/*" hidden onChange={e => {
          const file = e.target.files[0];
          if(file) setAudioSrc(URL.createObjectURL(file));
        }} />

        {/* TOP BAR */}
        <div className="absolute top-0 w-full pt-12 pb-6 px-6 flex justify-between items-center z-[100] bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[12px] font-bold border border-white/10 flex items-center gap-2 text-white">
            <Music size={14} className="text-cyan-400 animate-pulse"/> Add Sound
          </div>
          
          <button 
            onClick={handleNext}
            disabled={isUploading}
            className={`${isUploading ? 'bg-zinc-700' : 'bg-cyan-500'} px-6 py-2 rounded-full text-[13px] font-black uppercase text-black shadow-lg active:scale-95 transition-all`}
          >
            {isUploading ? <Loader2 className="animate-spin w-4 h-4"/> : "Next"}
          </button>
        </div>

        {/* PREVIEW AREA */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              style={{ filter: `${filter} ${effects[effect]}` }}
              onClick={() => setIsPlaying(!isPlaying)}
              playsInline
              loop
            />
          ) : (
            <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-4 cursor-pointer">
              <div className="p-6 bg-zinc-900 rounded-full border border-white/5 shadow-inner animate-pulse">
                <Plus size={40} className="text-cyan-500" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500/50">Load Neural Video</span>
            </div>
          )}

          {audioSrc && <audio ref={audioRef} src={audioSrc} />}

          {overlayText && (
            <motion.div drag dragConstraints={{left: -150, right: 150, top: -250, bottom: 250}}
              className="absolute top-1/3 left-1/4 z-40 bg-cyan-500 text-black px-4 py-1 font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] uppercase cursor-move">
              {overlayText}
            </motion.div>
          )}

          {/* RIGHT TOOLS */}
          <div className="absolute right-4 top-28 flex flex-col gap-6 z-[110]">
            {tools.map((tool) => (
              <button key={tool.id} onClick={(e) => { e.stopPropagation(); tool.action ? tool.action() : setMenu(tool.id) }} className="flex flex-col items-center gap-1">
                <div className="p-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-cyan-500 hover:text-black transition-all shadow-xl">
                  {tool.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter text-white/70">{tool.id}</span>
              </button>
            ))}
          </div>

          {!isPlaying && videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
              <Play size={80} fill="white" className="opacity-30" />
            </div>
          )}
        </div>

        {/* BOTTOM TIMELINE */}
        <div className="bg-[#0a0a0a] p-6 pb-12 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div onClick={() => fileInputRef.current.click()} className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 shrink-0 cursor-pointer">
              <Plus size={24} className="text-cyan-500"/>
            </div>
            <div className="flex-1 h-12 bg-zinc-950 rounded-xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 bottom-0 bg-cyan-500/30 border-x-2 border-cyan-500 z-10" 
                   style={{left: '0%', width: `${(currentTime/totalDuration)*100}%`}} />
              <div className="w-full h-full flex items-center px-2 gap-1 opacity-10">
                  {[...Array(25)].map((_,i) => <div key={i} className="flex-1 bg-white h-4 rounded-full" />)}
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] font-mono mt-4 text-zinc-500 tracking-widest">
            00:{currentTime.toFixed(2).padStart(5,'0')} / 00:30.00
          </div>
        </div>

        {/* SLIDE UP MENU */}
        <AnimatePresence>
          {menu && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="absolute bottom-0 w-full bg-[#121212] rounded-t-[40px] p-8 z-[200] border-t border-cyan-500/20 shadow-2xl">
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-8">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-cyan-500">{menu} Settings</span>
                <button onClick={() => setMenu(null)} className="p-2 bg-cyan-500 rounded-full text-black shadow-lg"><Check size={20}/></button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {menu === "Text" && (
                  <input autoFocus className="w-full p-5 bg-zinc-900 rounded-2xl outline-none border border-white/5 focus:border-cyan-500 text-white font-bold" 
                  placeholder="Type your caption..." value={overlayText} onChange={e => setOverlayText(e.target.value)} />
                )}
                {menu === "Filters" && ["none", "grayscale(1)", "sepia(1)", "invert(1)"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl border transition-all ${filter === f ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400':'border-white/5 text-zinc-500'}`}>{f}</button>
                ))}
                {menu === "Speed" && [0.5, 1, 1.5, 2].map(s => (
                  <button key={s} onClick={() => setSpeed(s)} className={`px-8 py-4 rounded-xl border transition-all ${speed === s ? 'border-cyan-500 bg-cyan-500 text-black font-black':'border-white/5 text-zinc-500'}`}>{s}x</button>
                ))}
              </div>
              <button onClick={() => setMenu(null)} className="w-full mt-10 bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">Apply Neural Sync</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TikTokEditor;