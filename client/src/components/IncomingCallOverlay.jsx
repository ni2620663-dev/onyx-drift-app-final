import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePhone, HiOutlinePhoneXMark } from "react-icons/hi2";

const IncomingCallOverlay = ({ callData, onAccept, onDecline }) => {
  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));

  useEffect(() => {
    const audio = ringtoneRef.current;
    audio.loop = true;
    audio.play().catch(err => console.log("Audio waiting for interaction..."));

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md bg-black/80 backdrop-blur-2xl border border-cyan-500/30 rounded-[2rem] p-4 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={callData.callerPic} 
              className="w-14 h-14 rounded-2xl border border-cyan-500/50 object-cover shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              alt="Caller"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest">{callData.callerName}</h3>
            <p className="text-cyan-500 text-[10px] font-mono animate-pulse">INCOMING NEURAL LINK...</p>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Decline Button */}
          <button 
            onClick={onDecline}
            className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
          >
            <HiOutlinePhoneXMark size={24} />
          </button>
          
          {/* Accept Button */}
          <button 
            onClick={onAccept}
            className="w-12 h-12 bg-green-500/20 border border-green-500/50 rounded-2xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-90"
          >
            <HiOutlinePhone size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCallOverlay;