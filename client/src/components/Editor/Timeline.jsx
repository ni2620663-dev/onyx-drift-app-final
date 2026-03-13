import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Scissors, Music, Type, Film, Sparkles } from "lucide-react";
import toast from 'react-hot-toast';
import { getBeatTimestamps } from "../../services/BeatSyncService"; // আপনার সার্ভিস ফাইল

const Timeline = ({ currentTime, duration, videoRef, isPlaying, clips, setClips, tracks }) => {
  const timelineRef = useRef(null);
  const audioInputRef = useRef(null);

  const timeToPx = (time) => time * 100;
  const pxToTime = (px) => px / 100;

  const handleSeek = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    if (videoRef.current) videoRef.current.currentTime = Math.min(Math.max(0, pxToTime(x)), duration);
  };

  // শক্তিশালী অটো-সিংকিং লজিক
  const handleAutoSync = async () => {
    const audioTrack = tracks.audio[0]; // ধরে নিলাম প্রথম অডিও ট্র্যাকটি মিউজিক
    if (!audioTrack) return toast.error("প্রথমে ব্যাকগ্রাউন্ড মিউজিক যোগ করুন!");
    
    const syncToast = toast.loading("OnyxDrift AI: Syncing visuals to rhythm...");
    try {
      const beats = await getBeatTimestamps(audioTrack.url);
      const syncedClips = clips.map((clip, index) => ({
        ...clip,
        startTime: beats[index % beats.length] || 0,
        duration: (beats[index + 1] - beats[index]) || 2
      }));
      setClips(syncedClips);
      toast.success("Timeline locked to rhythm!", { id: syncToast });
    } catch (e) {
      toast.error("Rhythm detection failed.", { id: syncToast });
    }
  };

  return (
    <div className="h-64 bg-[#0a0a0a] border-t border-white/10 flex flex-col z-20 overflow-hidden select-none">
      <div className="flex items-center gap-4 px-6 py-2 bg-zinc-900/50 border-b border-white/5">
        <div className="text-[10px] font-mono text-cyan-500">
          {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date(duration * 1000).toISOString().substr(14, 5)}
        </div>
        
        <button onClick={handleAutoSync} className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500 rounded text-cyan-400 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold border border-cyan-500/20">
          <Sparkles size={14} /> AUTO-SYNC
        </button>

        <button className="p-1.5 bg-red-500/10 hover:bg-red-500 rounded text-red-500 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold border border-red-500/20">
          <Scissors size={14} /> SPLIT
        </button>
      </div>

      <div ref={timelineRef} onClick={handleSeek} className="flex-1 overflow-x-auto relative custom-scrollbar bg-[#050505]">
        <div className="relative py-4" style={{ width: Math.max(timeToPx(duration), 1000), minWidth: '100%' }}>
          
          {/* VIDEO TRACK */}
          <div className="h-16 flex items-center mb-2">
             <div className="sticky left-0 z-30 bg-zinc-900 px-3 h-full flex items-center border-r border-white/5 min-w-[40px]">
                <Film size={12} className="text-cyan-400" />
             </div>
             {clips.map((clip, idx) => (
               <motion.div 
                 key={clip.id}
                 className="bg-cyan-500/20 border border-cyan-500/50 h-14 rounded-md ml-1"
                 style={{ left: timeToPx(clip.startTime || 0), width: timeToPx(clip.duration || 2), position: 'absolute' }}
               >
                 <span className="absolute bottom-1 left-1 text-[8px] font-bold opacity-50 uppercase">{clip.file?.name}</span>
               </motion.div>
             ))}
          </div>

          {/* PLAYHEAD */}
          <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none" style={{ left: timeToPx(currentTime) }}>
            <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5px] -mt-1 shadow-lg border-2 border-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;