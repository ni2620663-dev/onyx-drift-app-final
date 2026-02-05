import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiOutlinePhone } from "react-icons/hi2";

const CallOverlay = ({ incomingCall, setIncomingCall, ringtoneRef, navigate }) => {
  if (!incomingCall) return null;

  const handleAccept = () => {
    ringtoneRef.current.pause();
    navigate(`/call/${incomingCall.roomId}`);
    setIncomingCall(null);
  };

  const handleReject = () => {
    ringtoneRef.current.pause();
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }} 
        className="fixed inset-0 z-[500] bg-zinc-900/95 backdrop-blur-2xl flex flex-col items-center justify-center"
      >
        <div className="w-24 h-24 rounded-full bg-blue-600 animate-pulse mb-8 border-4 border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.5)]" />
        <h2 className="text-2xl font-bold text-white">{incomingCall.senderName || "Someone Calling"}</h2>
        <p className="text-blue-400 mt-2 animate-bounce tracking-widest text-sm uppercase">Incoming Call</p>
        
        <div className="flex gap-16 mt-24">
          <button onClick={handleReject} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-75 transition-all">
            <HiXMark size={35} className="text-white"/>
          </button>
          <button onClick={handleAccept} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-75 transition-all">
            <HiOutlinePhone size={35} className="text-white animate-pulse"/>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallOverlay;