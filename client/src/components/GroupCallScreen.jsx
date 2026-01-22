import React, { useState, useEffect, useRef } from "react";
import { 
  HiOutlineMicrophone, HiOutlinePhoneMissedCall, 
  HiOutlineVideoCamera, HiOutlineVideoCameraSlash,
  HiOutlineMicrophoneSlash, HiOutlineArrowsPointingOut
} from "react-icons/hi2";
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
    // ক্যামেরা পারমিশন নেওয়া
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      });
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[3000] flex flex-col p-4">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-cyan-500 font-black text-xs uppercase tracking-[0.3em]">Neural Link: Active</h2>
          <p className="text-white/60 text-sm">Room: {roomId?.substring(0, 8)}...</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold">04:22</span>
        </div>
      </div>

      {/* --- VIDEO GRID --- */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 mb-24">
        {peers.map((peer, index) => (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={peer.id}
            className="relative bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/5 group shadow-2xl"
          >
            {peer.id === 'me' ? (
              <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                {!peer.isOnline ? (
                   <div className="text-center">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-2 animate-pulse flex items-center justify-center">
                         <HiOutlineVideoCameraSlash className="text-zinc-600" size={24} />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Connecting...</p>
                   </div>
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.id}`} className="w-24 h-24 opacity-40 blur-sm" alt=""/>
                )}
              </div>
            )}
            
            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-white">{peer.name}</span>
              {index === 0 && <span className="text-[8px] text-cyan-500 font-black">HOST</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- CONTROLS --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-zinc-900/80 backdrop-blur-3xl px-8 py-5 rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => setMicActive(!micActive)}
          className={`p-4 rounded-full transition-all ${micActive ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500'}`}
        >
          {micActive ? <HiOutlineMicrophone size={24} /> : <HiOutlineMicrophoneSlash size={24} />}
        </button>

        <button 
          onClick={onHangup}
          className="p-5 bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-110 active:scale-95 transition-all"
        >
          <HiOutlinePhoneMissedCall size={32} />
        </button>

        <button 
          onClick={() => setVideoActive(!videoActive)}
          className={`p-4 rounded-full transition-all ${videoActive ? 'bg-zinc-800 text-white' : 'bg-red-500/20 text-red-500'}`}
        >
          {videoActive ? <HiOutlineVideoCamera size={24} /> : <HiOutlineVideoCameraSlash size={24} />}
        </button>
      </div>
    </div>
  );
};

export default GroupCallScreen;