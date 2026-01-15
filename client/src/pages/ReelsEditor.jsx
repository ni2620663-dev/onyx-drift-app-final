import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Play, Pause, Plus, X, Scissors, Type, Music4, Palette,
  Sparkles, Sticker, Gauge, RotateCcw, Check, Share2, Send, Download,
  Music, Layers, ChevronRight
} from "lucide-react";

const TikTokEditor = () => {
  const { getAccessTokenSilently, user } = useAuth0();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null); // আপলোডের জন্য অরিজিনাল ফাইল রাখা
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
      setVideoFile(file); // ফাইলটি সেভ করে রাখা
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setCurrentTime(0);
      setTimeout(() => videoRef.current?.load(), 100);
    }
  };

  const handleNext = async (e) => {
    e.stopPropagation();
    if (!videoFile) {
      alert("Please select a video first!");
      return;
    }

    try {
      setIsUploading(true);
      const token = await getAccessTokenSilently();
      
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("caption", overlayText || "Onyx Drift Reel");
      formData.append("userId", user?.sub);

      const res = await axios.post(`${API_URL}/api/reels/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.status === 201 || res.status === 200) {
        alert("Reel Uploaded Successfully!");
        setVideoSrc(null);
        setVideoFile(null);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Please try again.");
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
    <div className="fixed inset-0 bg-[#0a0a0a] flex justify-center items-center">
      
      <div className="relative w-full h-full max-w-[450px] max-h-[900px] bg-black overflow-hidden flex flex-col md:rounded-[40px] md:border-[8px] md:border-zinc-800 shadow-2xl">
        
        <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={uploadVideo} />
        <input ref={audioInputRef} type="file" accept="audio/*" hidden onChange={e => {
          const file = e.target.files[0];
          if(file) setAudioSrc(URL.createObjectURL(file));
        }} />

        {/* TOP BAR */}
        <div className="p-6 flex justify-between items-center z-[60] absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
          <X className="w-6 h-6 cursor-pointer" onClick={() => setVideoSrc(null)} />
          <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[12px] font-bold border border-white/10 flex items-center gap-2">
            <Music size={14} className="text-pink-500"/> Add Sound
          </div>
          
          <button 
            onClick={handleNext}
            disabled={isUploading}
            className={`${isUploading ? 'bg-gray-600' : 'bg-[#fe2c55]'} px-4 py-1.5 rounded-md text-[13px] font-bold active:scale-95 transition-transform`}
          >
            {isUploading ? "..." : "Next"}
          </button>
        </div>

        {/* PREVIEW */}
        <div className="flex-1 relative overflow-hidden bg-zinc-900">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              style={{ filter: `${filter} ${effects[effect]}` }}
              onClick={() => setIsPlaying(!isPlaying)}
              playsInline
            />
          ) : (
            <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-3 cursor-pointer">
              <div className="p-4 bg-zinc-800 rounded-full"><Plus size={32} /></div>
              <span className="text-[11px] font-bold uppercase tracking-widest">Select Video</span>
            </div>
          )}

          {audioSrc && <audio ref={audioRef} src={audioSrc} />}

          {overlayText && (
            <motion.div drag dragConstraints={{left: -100, right: 100, top: -200, bottom: 200}}
              className="absolute top-1/3 left-1/4 z-40 bg-white text-black px-4 py-1 font-black text-xl shadow-2xl uppercase cursor-move">
              {overlayText}
            </motion.div>
          )}

          {/* RIGHT SIDEBAR */}
          <div className="absolute right-4 top-20 bottom-32 flex flex-col justify-between items-center z-50">
            <div className="flex flex-col gap-6">
              {tools.map((tool) => (
                <button key={tool.id} onClick={(e) => { e.stopPropagation(); tool.action ? tool.action() : setMenu(tool.id) }} className="flex flex-col items-center">
                  <div className="p-2.5 bg-black/30 backdrop-blur-xl rounded-full border border-white/5 shadow-lg active:scale-90 transition-all">
                    {tool.icon}
                  </div>
                  <span className="text-[10px] mt-1 font-bold">{tool.id}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <div className="p-3 bg-zinc-800/80 rounded-full"><Share2 size={24}/></div>
              </div>
              <div className="flex flex-col items-center cursor-pointer" onClick={handleNext}>
                <div className="p-3 bg-[#fe2c55] rounded-full shadow-[0_0_15px_rgba(254,44,85,0.4)]">
                   {isUploading ? <RotateCcw className="animate-spin" size={24}/> : <Send size={24}/>}
                </div>
              </div>
            </div>
          </div>

          {!isPlaying && videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
              <Play size={60} fill="white" className="opacity-50" />
            </div>
          )}
        </div>

        {/* BOTTOM TIMELINE */}
        <div className="bg-black p-4 pb-8 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div onClick={() => fileInputRef.current.click()} className="w-10 h-10 bg-zinc-800 rounded-md flex items-center justify-center border border-white/10 shrink-0 cursor-pointer">
              <Plus size={20}/>
            </div>
            <div className="flex-1 h-10 bg-zinc-900 rounded-md relative overflow-hidden border border-white/5">
              <div className="absolute top-0 bottom-0 bg-[#fe2c55]/40 border-x border-[#fe2c55] z-10" 
                   style={{left: '0%', width: `${(currentTime/totalDuration)*100}%`}} />
              <div className="w-full h-full flex items-center px-2 gap-1 opacity-20">
                  {[...Array(20)].map((_,i) => <div key={i} className="flex-1 bg-white h-3 rounded-full" />)}
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] font-mono mt-3 text-zinc-500">
            00:{currentTime.toFixed(2).padStart(5,'0')} / 00:30.00
          </div>
        </div>

        {/* SLIDE UP MENU */}
        <AnimatePresence>
          {menu && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="absolute bottom-0 w-full bg-[#121212] rounded-t-[32px] p-8 z-[100] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-black uppercase tracking-[0.2em]">{menu} Studio</span>
                <button onClick={() => setMenu(null)} className="p-2 bg-white/5 rounded-full"><Check className="text-green-500" size={20}/></button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {menu === "Text" && (
                  <input autoFocus className="w-full p-4 bg-zinc-900 rounded-xl outline-none border border-[#fe2c55]/50 focus:border-[#fe2c55] text-white" 
                  placeholder="Enter caption..." onChange={e => setOverlayText(e.target.value)} />
                )}
                {menu === "Filters" && ["none", "grayscale(1)", "sepia(1)"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-5 py-3 rounded-xl border ${filter === f ? 'border-[#fe2c55] bg-[#fe2c55]/10':'border-white/5'} text-[10px] font-bold uppercase`}>{f}</button>
                ))}
                {menu === "Speed" && [0.5, 1, 1.5, 2].map(s => (
                  <button key={s} onClick={() => setSpeed(s)} className={`px-6 py-3 rounded-xl border ${speed === s ? 'border-yellow-500 bg-yellow-500/10':'border-white/5'} text-xs font-bold`}>{s}x</button>
                ))}
              </div>
              <button onClick={() => setMenu(null)} className="w-full mt-10 bg-white text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest">Apply Changes</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TikTokEditor;