import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import { 
  HiOutlineMicrophone, 
  HiOutlineVideoCamera, 
  HiOutlineArrowsPointingOut 
} from "react-icons/hi2";
import { 
  HiPhoneMissedCall, 
  HiMicrophone, 
  HiVideoCamera,
  HiOutlineScreenShare
} from "react-icons/hi"; 
import { motion, AnimatePresence } from "framer-motion";

// --- স্টাইলিশ ভিডিও কম্পোনেন্ট (Peer Stream এর জন্য) ---
const Video = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <motion.div layout className="relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl">
      <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5">
         <p className="text-[10px] font-mono text-cyan-400">REMOTE_NODE // STABLE</p>
      </div>
    </motion.div>
  );
};

const GroupCallScreen = ({ roomId, user, socket, onHangup }) => {
  const [peers, setPeers] = useState([]);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const userStream = useRef();

  useEffect(() => {
    socketRef.current = socket;
    
    // ১. ক্যামেরা ও মাইক্রোফোন এক্সেস
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      userStream.current = stream;
      if (userVideo.current) userVideo.current.srcObject = stream;

      // রুমে জয়েন করা
      socketRef.current.emit("join-room", { roomId, userId: user.sub });

      // নতুন কেউ জয়েন করলে তাকে সিগন্যাল পাঠানো
      socketRef.current.on("all-users", (users) => {
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socketRef.current.id, stream);
          peersRef.current.push({
            peerID: userID,
            peer,
          });
          peers.push({ peerID: userID, peer });
        });
        setPeers(peers);
      });

      // রিসিভার সাইড: অফার গ্রহণ করা
      socketRef.current.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });
        setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
      });

      // সিগন্যাল রিটার্ন পাওয়া
      socketRef.current.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      // কেউ কল থেকে বের হয়ে গেলে
      socketRef.current.on("user-left", (id) => {
        const peerObj = peersRef.current.find((p) => p.peerID === id);
        if (peerObj) peerObj.peer.destroy();
        const updatedPeers = peersRef.current.filter((p) => p.peerID !== id);
        peersRef.current = updatedPeers;
        setPeers(updatedPeers);
      });
    });

    return () => {
      if (userStream.current) {
        userStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- WebRTC Core Functions ---
  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", { userToSignal, callerID, signal });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("returning-signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMic = () => {
    setMicActive(!micActive);
    userStream.current.getAudioTracks()[0].enabled = !micActive;
  };

  const toggleVideo = () => {
    setVideoActive(!videoActive);
    userStream.current.getVideoTracks()[0].enabled = !videoActive;
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-[5000] flex flex-col p-6 text-white overflow-hidden">
      {/* Neural Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8 z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h2 className="text-xl font-black tracking-tighter italic uppercase text-white">Onyx<span className="text-cyan-500">Drift</span> Call</h2>
          </div>
          <p className="text-white/20 font-mono text-[10px] tracking-widest">{roomId.toUpperCase()}</p>
        </div>
        
        <div className="flex gap-2">
           <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
             <p className="text-[10px] font-bold text-cyan-500 tracking-tighter uppercase">{peers.length + 1} Drifters Active</p>
           </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid gap-6 transition-all duration-700 ${
        peers.length === 0 ? 'grid-cols-1 max-w-4xl mx-auto w-full' : 
        peers.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        
        {/* Local User Video */}
        <motion.div layout className="relative bg-zinc-900/60 rounded-[3rem] overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] group">
          <video ref={userVideo} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] transition-transform duration-700 ${!videoActive && 'hidden'}`} />
          {!videoActive && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <HiVideoCamera size={40} className="text-cyan-500/40" />
                </div>
             </div>
          )}
          <div className="absolute top-6 right-6 px-3 py-1 bg-cyan-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest">Host</div>
          <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  {micActive ? <HiOutlineMicrophone className="text-cyan-400" /> : <HiMicrophone className="text-red-500" />}
              </div>
              <p className="text-xs font-bold tracking-tight">You (Neural_Source)</p>
          </div>
        </motion.div>

        {/* Remote Peers Video */}
        {peers.map((peer) => (
          <Video key={peer.peerID} peer={peer.peer} />
        ))}
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-3xl p-5 rounded-[3rem] border border-white/10 shadow-2xl"
        >
          <ControlBtn onClick={toggleMic} active={micActive} icon={micActive ? <HiOutlineMicrophone size={24} /> : <HiMicrophone size={24} />} />
          
          <button 
            onClick={onHangup}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-red-500/40 transition-all hover:scale-110 active:scale-90 group"
          >
            <HiPhoneMissedCall size={32} className="group-hover:rotate-12 transition-transform" />
          </button>

          <ControlBtn onClick={toggleVideo} active={videoActive} icon={videoActive ? <HiOutlineVideoCamera size={24} /> : <HiVideoCamera size={24} />} />
        </motion.div>
      </div>
    </div>
  );
};

const ControlBtn = ({ onClick, active, icon }) => (
  <button 
    onClick={onClick}
    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
      active ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
    }`}
  >
    {icon}
  </button>
);

export default GroupCallScreen;