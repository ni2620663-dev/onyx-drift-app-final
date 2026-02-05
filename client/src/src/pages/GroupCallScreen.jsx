import React, { useState, useEffect, useRef } from "react";
// Hi2 থেকে যেগুলো কনফার্ম পাওয়া যায় সেগুলো আনা হচ্ছে
import { 
  HiOutlineMicrophone, 
  HiOutlineVideoCamera, 
  HiOutlineArrowsPointingOut 
} from "react-icons/hi2";

// যে আইকনগুলো ঝামেলা করছে সেগুলো Hi (Version 1) থেকে আনা হচ্ছে কারণ এগুলো অনেক স্টেবল
import { 
  HiPhoneMissedCall, 
  HiMicrophone, 
  HiVideoCamera 
} from "react-icons/hi"; 

import { motion, AnimatePresence } from "framer-motion";

const GroupCallScreen = ({ roomId, participants, onHangup }) => {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [peers, setPeers] = useState([
    { id: 'me', name: 'You', stream: null },
    { id: 'p1', name: 'Drifter_01', stream: null, isOnline: true },
    { id: 'p2', name: 'Neon_Ghost', stream: null, isOnline: true },
    { id: 'p3', name: 'Onyx_Admin', stream: null, isOnline: false },
  ]);

  const myVideoRef = useRef();

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Camera access failed:", err));
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[3000] flex flex-col p-4 font-sans text-white">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.3em]">Neural Link: Active</h2>
          <p className="text-white/40 text-[11px] font-mono">Room ID: {roomId?.substring(0, 12)}</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
          <span className="text-[10px] font-bold">04:22</span>
        </div>
      </div>

      {/* --- VIDEO GRID --- */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 mb-24">
        {peers.map((peer, index) => (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={peer.id}
            className="relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl"
          >
            {peer.id === 'me' ? (
              <video 
                ref={myVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover scale-x-[-1] ${!videoActive ? 'opacity-0' : 'opacity-100'}`} 
              />
            ) : null}

            {((peer.id === 'me' && !videoActive) || peer.id !== 'me') && (
               <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                {!peer.isOnline && peer.id !== 'me' ? (
                   <div className="text-center">
                      <div className="w-12 h-12 bg-zinc-800/50 rounded-full mx-auto mb-3 flex items-center justify-center border border-white/5">
                         <HiVideoCamera className="text-zinc-600" size={20} />
                      </div>
                      <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Signal Lost</p>
                   </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.id}`} 
                      className="w-16 h-16 rounded-full border-2 border-white/10 grayscale opacity-70" 
                      alt="avatar"
                    />
                    {peer.id === 'me' && !micActive && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-full border border-zinc-900">
                        <HiMicrophone size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-bold">{peer.name}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- CONTROLS --- */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-zinc-900/90 backdrop-blur-3xl px-8 py-5 rounded-[3.5rem] border border-white/10 shadow-2xl">
        <button 
          onClick={() => setMicActive(!micActive)}
          className={`p-4 rounded-full transition-all ${micActive ? 'bg-zinc-800 text-white' : 'bg-red-500 text-white'}`}
        >
          {micActive ? <HiOutlineMicrophone size={24} /> : <HiMicrophone size={24} />}
        </button>

        <button 
          onClick={onHangup}
          className="p-5 bg-red-600 text-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-90 transition-transform"
        >
          <HiPhoneMissedCall size={28} />
        </button>

        <button 
          onClick={() => setVideoActive(!videoActive)}
          className={`p-4 rounded-full transition-all ${videoActive ? 'bg-zinc-800 text-white' : 'bg-red-500 text-white'}`}
        >
          {videoActive ? <HiOutlineVideoCamera size={24} /> : <HiVideoCamera size={24} />}
        </button>
      </div>
    </div>
  );
};

export default GroupCallScreen;