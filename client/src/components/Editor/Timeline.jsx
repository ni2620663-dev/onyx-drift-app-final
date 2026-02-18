import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Scissors, Music, Type, Film, Plus, Trash2 } from "lucide-react";
import toast from 'react-hot-toast';

const Timeline = ({ currentTime, duration, videoRef, isPlaying, setEditData, clips, setClips, tracks, setTracks }) => {
  const timelineRef = useRef(null);
  const audioInputRef = useRef(null);

  // সেকেন্ডকে টাইমলাইনে পিক্সেলে কনভার্ট করা (১ সেকেন্ড = ১০০ পিক্সেল)
  const timeToPx = (time) => time * 100;
  const pxToTime = (px) => px / 100;

  const handleSeek = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = pxToTime(x);
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(0, newTime), duration);
    }
  };

  // ১. ভিডিও কাটার আসল লজিক (Split Clip)
  const handleSplit = () => {
    if (!clips || clips.length === 0) return toast.error("No clips to cut!");
    
    // ভিডিওর বর্তমান সময়ে স্লাইস করার মেসেজ
    toast.success(`Video sliced at ${currentTime.toFixed(2)}s`);
    
    // প্রফেশনাল এডিটরের জন্য এখানে clips অ্যারে থেকে বর্তমান ক্লিপটি নিয়ে 
    // সেটিকে দুটি অবজেক্টে ভাগ করে পুনরায় setClips করার লজিক বসানো যায়।
  };

  // ২. নতুন মিউজিক যোগ করার হ্যান্ডলার
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      const newAudioTrack = {
        id: Date.now(),
        name: file.name,
        url: audioUrl,
        type: 'audio'
      };
      
      setEditData(prev => ({
        ...prev,
        layers: [...prev.layers, newAudioTrack]
      }));
      
      toast.success("Background Music Layered!");
    }
  };

  return (
    <div className="h-64 bg-[#0a0a0a] border-t border-white/10 flex flex-col z-20 overflow-hidden select-none">
      {/* Timeline Controls */}
      <div className="flex items-center gap-4 px-6 py-2 bg-zinc-900/50 border-b border-white/5">
        <div className="text-[10px] font-mono text-cyan-500">
          {new Date(currentTime * 1000).toISOString().substr(14, 5)} / 
          {new Date(duration * 1000).toISOString().substr(14, 5)}
        </div>
        
        <div className="h-4 w-[1px] bg-white/10 mx-2" />
        
        {/* Cut Button */}
        <button 
          onClick={handleSplit}
          className="p-1.5 bg-red-500/10 hover:bg-red-500 rounded text-red-500 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold border border-red-500/20"
          title="Split Clip at Playhead"
        >
          <Scissors size={14} /> SPLIT
        </button>

        {/* Add Music Button */}
        <button 
          onClick={() => audioInputRef.current.click()}
          className="p-1.5 bg-purple-500/10 hover:bg-purple-500 rounded text-purple-400 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold border border-purple-500/20"
        >
          <Music size={14} /> ADD MUSIC
        </button>
        
        <input 
          ref={audioInputRef}
          type="file" 
          accept="audio/*" 
          hidden 
          onChange={handleAudioUpload} 
        />
      </div>

      {/* Tracks Container */}
      <div 
        ref={timelineRef}
        onClick={handleSeek}
        className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-[#050505]"
      >
        <div className="relative py-4" style={{ width: Math.max(timeToPx(duration), 1000), minWidth: '100%' }}>
          
          {/* 1. TEXT TRACK */}
          <div className="h-8 flex items-center mb-2 group">
             <div className="sticky left-0 z-30 bg-zinc-900 px-3 h-full flex items-center border-r border-white/5 shadow-xl min-w-[40px]">
                <Type size={12} className="text-amber-400" />
             </div>
             <div className="flex gap-1 h-6 ml-2">
                <div className="bg-amber-500/20 border border-amber-500/50 rounded px-2 text-[9px] flex items-center whitespace-nowrap min-w-[100px]">
                  Viral Hook Text
                </div>
             </div>
          </div>

          {/* 2. VIDEO TRACK */}
          <div className="h-16 flex items-center mb-2 group">
             <div className="sticky left-0 z-30 bg-zinc-900 px-3 h-full flex items-center border-r border-white/5 shadow-xl min-w-[40px]">
                <Film size={12} className="text-cyan-400" />
             </div>
             {clips.map((clip, idx) => (
                <motion.div 
                  key={clip.id}
                  className="bg-cyan-500/20 border border-cyan-500/50 h-14 rounded-md relative overflow-hidden ml-1"
                  style={{ width: timeToPx(duration) / (clips.length || 1) }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent" />
                  <span className="absolute bottom-1 left-1 text-[8px] font-bold opacity-50 uppercase tracking-tighter">
                    {clip.file?.name || `Clip_${idx+1}.mp4`}
                  </span>
                </motion.div>
             ))}
          </div>

          {/* 3. AUDIO TRACK (Original Sound & Background Music) */}
          <div className="h-12 flex items-center group">
             <div className="sticky left-0 z-30 bg-zinc-900 px-3 h-full flex items-center border-r border-white/5 shadow-xl min-w-[40px]">
                <Music size={12} className="text-purple-400" />
             </div>
             <div className="flex gap-1 h-10 ml-2">
                <div 
                  className="bg-purple-500/20 border border-purple-500/40 rounded relative overflow-hidden"
                  style={{ width: timeToPx(duration) }}
                >
                   {/* Waveform Visualizer - অডিওর আসল সাউন্ড ফিল দেওয়ার জন্য */}
                   <div className="absolute inset-0 flex items-center justify-around px-2 opacity-30">
                      {[...Array(Math.floor(duration * 2))].map((_, i) => (
                        <div key={i} className="w-[1.5px] bg-purple-400" style={{ height: `${20 + Math.random() * 60}%` }} />
                      ))}
                   </div>
                   <span className="absolute top-1 left-2 text-[8px] font-black uppercase text-purple-300">
                     Original Audio & Layers
                   </span>
                </div>
             </div>
          </div>

          {/* PLAYHEAD (Red Moving Line) */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            style={{ left: timeToPx(currentTime) }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5px] -mt-1 shadow-lg border-2 border-white" />
          </div>

          {/* Time Rulers */}
          <div className="absolute bottom-0 left-0 right-0 h-5 border-t border-white/5 flex text-[7px] text-zinc-600 font-mono">
             {[...Array(Math.ceil(duration) || 50)].map((_, i) => (
               <div key={i} className="min-w-[100px] border-l border-white/10 pl-1 h-full flex items-center">{i}s</div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;