import React, { useState, useEffect, useRef } from "react";
import { 
  HiOutlineMicrophone, 
  HiOutlineVideoCamera, 
  HiOutlineArrowsPointingOut 
} from "react-icons/hi2";
import { 
  HiPhoneMissedCall, 
  HiMicrophone, 
  HiVideoCamera 
} from "react-icons/hi"; 
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

// --- 🔊 কল সাউন্ড ইফেক্ট ---
const joinSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");

const GroupCallScreen = ({ roomId, user, socket, onHangup }) => {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [participants, setParticipants] = useState([]); // অন্যান্য ইউজারদের স্ট্রিম এখানে থাকবে
  const myVideoRef = useRef();
  const localStream = useRef(null);

  // ১. নিজের ক্যামেরা ও অডিও সেটআপ
  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        localStream.current = stream;
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        
        // রিংটোন প্লে (কল শুরু হলে)
        joinSound.play().catch(e => console.log("Audio play blocked"));

        // সকেটের মাধ্যমে রুমে জয়েন করা
        socket.emit("join-room", { roomId, userId: user.sub, name: user.name });
      } catch (err) {
        console.error("Neural Link Camera Error:", err);
      }
    };

    startLocalStream();

    // ক্লিন আপ ফাংশন: কল কাটলে ক্যামেরা বন্ধ হবে
    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, socket, user]);

  // ২. সকেট লিসেনার (অন্যরা জয়েন করলে তাদের ডেটা পাওয়া)
  useEffect(() => {
    socket.on("user-connected", (data) => {
      console.log("New Drifter Joined:", data.name);
      setParticipants(prev => [...prev, data]);
      joinSound.play(); // নতুন কেউ এলে হালকা রিংটোন
    });

    socket.on("user-disconnected", (userId) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    });

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");
    };
  }, [socket]);

  // মিউট/আনমিউট লজিক
  const toggleMic = () => {
    setMicActive(!micActive);
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = !micActive;
    }
  };

  const toggleVideo = () => {
    setVideoActive(!videoActive);
    if (localStream.current) {
      localStream.current.getVideoTracks()[0].enabled = !videoActive;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-[5000] flex flex-col p-4 font-sans text-white overflow-hidden">
      <div className="bg-grainy opacity-20" />

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 px-4 z-10">
        <div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
             <h2 className="text-cyan-500 font-black text-xs uppercase tracking-[0.4em]">Neural Grid: Synchronized</h2>
          </div>
          <p className="text-white/30 text-[10px] font-mono mt-1">SECURE_CHANNEL // {roomId}</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl">
           <span className="text-cyan-500 font-mono text-xs tracking-widest uppercase">
             {participants.length + 1} Drifters Linked
           </span>
        </div>
      </div>

      {/* --- VIDEO GRID --- */}
      <div className={`flex-1 grid gap-4 transition-all duration-500 ${
        participants.length === 0 ? 'grid-cols-1' : 
        participants.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'
      }`}>
        
        {/* নিজের ভিডিও */}
        <motion.div layout className="relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-cyan-500/20 shadow-2xl group">
          <video 
            ref={myVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${!videoActive ? 'opacity-0' : 'opacity-100'}`} 
          />
          {!videoActive && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]">
                <div className="w-24 h-24 rounded-full bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-4">
                   <HiVideoCamera className="text-cyan-500/20" size={40} />
                </div>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Signal Encrypted</p>
             </div>
          )}
          <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5">
             <p className="text-xs font-bold tracking-tight">You (Neural_Alpha)</p>
          </div>
        </motion.div>

        {/* অন্যদের ভিডিও (Participants) */}
        {participants.map((peer, index) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={peer.userId}
            className="relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 group"
          >
            {/* এখানে Peer-to-Peer Stream আসবে, আপাতত সিমুলেশন */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#080808]">
               <img 
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.userId}`} 
                 className="w-24 h-24 rounded-full border border-white/10" 
                 alt="peer"
               />
            </div>
            <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5">
               <p className="text-xs font-bold">{peer.name || "Unknown Drifter"}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- CONTROLS --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-3xl px-10 py-6 rounded-[4rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <button 
            onClick={toggleMic}
            className={`p-5 rounded-full transition-all duration-300 ${micActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500 text-white animate-pulse'}`}
          >
            {micActive ? <HiOutlineMicrophone size={26} /> : <HiMicrophone size={26} />}
          </button>

          <button 
            onClick={onHangup}
            className="p-7 bg-red-600 text-white rounded-[2.5rem] shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <HiPhoneMissedCall size={32} className="group-hover:rotate-[135deg] transition-transform duration-500" />
          </button>

          <button 
            onClick={toggleVideo}
            className={`p-5 rounded-full transition-all duration-300 ${videoActive ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-red-500 text-white animate-pulse'}`}
          >
            {videoActive ? <HiOutlineVideoCamera size={26} /> : <HiVideoCamera size={26} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCallScreen;