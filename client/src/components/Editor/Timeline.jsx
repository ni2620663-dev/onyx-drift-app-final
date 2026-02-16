import React from 'react';
import { Scissors, RotateCw, Trash2, Rewind, FastForward, Play, Pause, Layers } from "lucide-react";

const TimelineAction = ({ icon: Icon, label, onClick, color = "hover:text-white" }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 ${color}`}>
    <Icon size={12} /> {label}
  </button>
);

const Timeline = ({ currentTime, duration, videoRef, isPlaying, setEditData, setVideoSrc, clips = [] }) => {
  return (
    <div className="px-4 md:px-20 pb-24 md:pb-10">
      <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl">
        
        {/* Header with Stats & Multi-clip Info */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div className="flex gap-6 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-cyan-500 font-black tracking-tighter">TIME</span>
              <span className="text-xl font-mono leading-none">{currentTime.toFixed(2)}s</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-600 font-black tracking-tighter">TOTAL</span>
              <span className="text-xl font-mono leading-none text-zinc-500">{duration.toFixed(2)}s</span>
            </div>
            {clips.length > 0 && (
              <>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <Layers size={14} className="text-cyan-500" />
                  <span className="text-[10px] font-black text-cyan-500 uppercase">{clips.length} Clips Loaded</span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <TimelineAction icon={RotateCw} label="Flip" onClick={() => setEditData(p => ({ ...p, isFlipped: !p.isFlipped }))} />
            <TimelineAction icon={Trash2} label="Reset" color="hover:text-red-500" onClick={() => setVideoSrc(null)} />
          </div>
        </div>

        {/* Visual Timeline Bar */}
        <div className="relative group">
          {/* Multi-clip Track Visualizer */}
          <div className="h-14 md:h-24 bg-black/60 rounded-2xl md:rounded-3xl relative border border-white/5 overflow-hidden flex gap-1 p-1">
            {clips.length > 0 ? (
              clips.map((clip, index) => (
                <div 
                  key={clip.id} 
                  className="h-full bg-zinc-800 rounded-lg flex-1 min-w-[60px] relative overflow-hidden group/clip"
                  onClick={() => setVideoSrc(clip.src)}
                >
                  <video src={clip.src} className="w-full h-full object-cover opacity-40 group-hover/clip:opacity-80 transition-opacity" />
                  <div className="absolute bottom-1 left-2 text-[8px] font-black text-white/50">#0{index + 1}</div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest italic">
                No Neural Sequences Found
              </div>
            )}

            {/* Playhead Slider */}
            <input 
              type="range" min="0" max={duration || 0} step="0.001" 
              value={currentTime} 
              onChange={(e) => videoRef.current.currentTime = e.target.value} 
              className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-30" 
            />
            
            {/* Playhead Indicator */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,1)] z-20 pointer-events-none transition-all duration-75" 
              style={{ left: `${(currentTime / duration) * 100}%` }} 
            >
              <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-cyan-500 rounded-full scale-50 shadow-lg" />
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="mt-4 md:mt-8 flex justify-center items-center gap-8 md:gap-12">
          <button onClick={() => videoRef.current.currentTime -= 5} className="text-zinc-500 hover:text-white transition-colors">
            <Rewind size={22} />
          </button>
          
          <button 
            onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()} 
            className="w-14 h-14 md:w-20 md:h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all"
          >
            {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
          </button>
          
          <button onClick={() => videoRef.current.currentTime += 5} className="text-zinc-500 hover:text-white transition-colors">
            <FastForward size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timeline;