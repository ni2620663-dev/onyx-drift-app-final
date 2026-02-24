import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import { 
  HiOutlineMicrophone, 
  HiOutlineVideoCamera, 
} from "react-icons/hi2";
import { 
  HiPhoneMissedCall, 
  HiMicrophone, 
  HiVideoCamera,
} from "react-icons/hi"; 
import { motion } from "framer-motion";

// --- স্টাইলিশ ভিডিও কম্পোনেন্ট ---
const Video = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <motion.div layout className="relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl h-[300px] md:h-full">
      <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5">
         <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Remote Node // Stable</p>
      </div>
    </motion.div>
  );
};

const GroupCallScreen = ({ roomId, user, socket, onHangup }) => {
  const [peers, setPeers] = useState([]);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  
  const userVideo = useRef();
  const peersRef = useRef([]);
  const userStream = useRef();

  useEffect(() => {
    // ১. মিডিয়া ডিভাইস এক্সেস
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      userStream.current = stream;
      if (userVideo.current) userVideo.current.srcObject = stream;

      // ২. রুমে জয়েন করার সিগন্যাল
      socket.emit("join-room", { roomId, userId: user.sub });

      // ৩. রুমে থাকা অন্য ইউজারদের লিস্ট পাওয়া
      socket.on("all-users", (users) => {
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socket.id, stream);
          peersRef.current.push({
            peerID: userID,
            peer,
          });
          peers.push({
            peerID: userID,
            peer,
          });
        });
        setPeers(peers);
      });

      // ৪. নতুন কেউ জয়েন করলে তার সিগন্যাল হ্যান্ডেল করা
      socket.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });
        setPeers((prev) => [...prev, { peerID: payload.callerID, peer }]);
      });

      // ৫. রিটার্নড সিগন্যাল এক্সেপ্ট করা
      socket.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        if (item) {
          item.peer.signal(payload.signal);
        }
      });

      // ৬. ইউজার লিভ করলে ডাটা রিমুভ করা
      socket.on("user-left", (id) => {
        const peerObj = peersRef.current.find((p) => p.peerID === id);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const updatedPeers = peersRef.current.filter((p) => p.peerID !== id);
        peersRef.current = updatedPeers;
        setPeers(updatedPeers);
      });
    }).catch(err => console.error("Media Access Error:", err));

    return () => {
      // Cleanup on Unmount
      if (userStream.current) {
        userStream.current.getTracks().forEach(track => track.stop());
      }
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-left");
    };
  }, [roomId, socket, user.sub]);

  // --- WebRTC কাস্টম ফাংশনসমূহ ---
  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  }

  // কন্ট্রোল ফাংশন
  const toggleMic = () => {
    if (userStream.current) {
      userStream.current.getAudioTracks()[0].enabled = !micActive;
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (userStream.current) {
      userStream.current.getVideoTracks()[0].enabled = !videoActive;
      setVideoActive(!videoActive);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] z-[5000] flex flex-col p-4 md:p-8 text-white overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#06b6d410_0%,_transparent_70%)] pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <h2 className="text-lg font-black tracking-tighter uppercase italic">
              Onyx<span className="text-cyan-500">Drift</span> <span className="text-white/40 not-italic font-light">Grid_Call</span>
            </h2>
          </div>
          <p className="text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">{roomId}</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
           <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">{peers.length + 1} Connected</p>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid gap-4 md:gap-6 mb-24 overflow-y-auto pr-2 ${
        peers.length === 0 ? 'grid-cols-1 max-w-2xl mx-auto w-full' : 
        peers.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        
        {/* Local Video */}
        <motion.div layout className="relative bg-zinc-900/60 rounded-[2.5rem] overflow-hidden border-2 border-cyan-500/20 shadow-2xl group min-h-[300px]">
          <video ref={userVideo} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${!videoActive && 'opacity-0'}`} />
          {!videoActive && (
             <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                <div className="w-20 h-20 rounded-full bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center">
                    <HiVideoCamera size={32} className="text-cyan-500/20" />
                </div>
             </div>
          )}
          <div className="absolute top-6 left-6 px-3 py-1 bg-cyan-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-cyan-500/20">Source_Node</div>
          <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${micActive ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/20 text-red-500'}`}>
                  {micActive ? <HiOutlineMicrophone size={16} /> : <HiMicrophone size={16} />}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-tight">You</p>
          </div>
        </motion.div>

        {/* Remote Peers */}
        {peers.map((peer) => (
          <Video key={peer.peerID} peer={peer.peer} />
        ))}
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5001] w-full max-w-xs px-4">
        <motion.div 
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between bg-zinc-900/90 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <button 
            onClick={toggleMic}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micActive ? 'bg-white/5 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse'}`}
          >
            {micActive ? <HiOutlineMicrophone size={22} /> : <HiMicrophone size={22} />}
          </button>
          
          <button 
            onClick={onHangup}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-red-500/40 transition-transform active:scale-90"
          >
            <HiPhoneMissedCall size={28} />
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${videoActive ? 'bg-white/5 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse'}`}
          >
            {videoActive ? <HiOutlineVideoCamera size={22} /> : <HiVideoCamera size={22} />}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default GroupCallScreen;