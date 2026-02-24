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
import { motion, AnimatePresence } from "framer-motion";

const Video = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    if (peer) {
      peer.on("stream", (stream) => {
        if (ref.current) ref.current.srcObject = stream;
      });
    }
  }, [peer]);

  return (
    <motion.div layout className="relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl h-[300px]">
      <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-xl px-3 py-1 rounded-xl border border-white/5">
         <p className="text-[9px] font-mono text-cyan-400">REMOTE_NODE // ENCRYPTED</p>
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
  const ringtoneRef = useRef(new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_733604471c.mp3")); // Unique Cyber Tone

  useEffect(() => {
    // রিংটোন প্লে করা
    ringtoneRef.current.loop = true;
    ringtoneRef.current.play().catch(e => console.log("Autoplay blocked"));

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      userStream.current = stream;
      if (userVideo.current) userVideo.current.srcObject = stream;

      socket.emit("join-room", { roomId, userId: user?.sub });

      socket.on("all-users", (users) => {
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socket.id, stream);
          peersRef.current.push({ peerID: userID, peer });
          peers.push({ peerID: userID, peer });
        });
        setPeers(peers);
        if (users.length > 0) ringtoneRef.current.pause(); // কেউ জয়েন করলে রিংটোন বন্ধ
      });

      socket.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({ peerID: payload.callerID, peer });
        setPeers((prev) => [...prev, { peerID: payload.callerID, peer }]);
        ringtoneRef.current.pause();
      });

      socket.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current?.find((p) => p.peerID === payload.id);
        if (item?.peer) {
          item.peer.signal(payload.signal);
        }
      });

      socket.on("user-left", (id) => {
        const peerObj = peersRef.current?.find((p) => p.peerID === id);
        if (peerObj?.peer) peerObj.peer.destroy();
        const updatedPeers = peersRef.current?.filter((p) => p.peerID !== id);
        peersRef.current = updatedPeers;
        setPeers(updatedPeers);
      });
    });

    return () => {
      ringtoneRef.current.pause();
      userStream.current?.getTracks().forEach(track => track.stop());
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-left");
    };
  }, []);

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

  return (
    <div className="fixed inset-0 bg-[#020617] z-[5000] flex flex-col p-6 text-white overflow-hidden">
      {/* Neural Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#06b6d410_0%,_transparent_70%)] pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 z-10">
        <h2 className="text-xl font-black tracking-tighter italic uppercase">
          ONYX<span className="text-cyan-500">DRIFT</span> <span className="text-white/20 not-italic font-mono text-xs ml-2">v2.0_GRID</span>
        </h2>
        <div className="px-4 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{peers.length + 1} Drifters</p>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`flex-1 grid gap-6 ${
        peers.length === 0 ? 'grid-cols-1 max-w-xl mx-auto w-full' : 
        peers.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        <motion.div layout className="relative bg-zinc-900 rounded-[2.5rem] overflow-hidden border-2 border-cyan-500/30 min-h-[300px]">
          <video ref={userVideo} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] ${!videoActive && 'opacity-0'}`} />
          {!videoActive && <div className="absolute inset-0 flex items-center justify-center"><HiVideoCamera size={40} className="text-white/10" /></div>}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl">
            {micActive ? <HiOutlineMicrophone className="text-cyan-400" /> : <HiMicrophone className="text-red-500" />}
            <span className="text-[10px] font-bold uppercase">You</span>
          </div>
        </motion.div>

        {peers.map((peer) => <Video key={peer.peerID} peer={peer.peer} />)}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-8 mb-4 z-10">
        <button onClick={() => {
          userStream.current.getAudioTracks()[0].enabled = !micActive;
          setMicActive(!micActive);
        }} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${micActive ? 'bg-white/5' : 'bg-red-500/20 text-red-500'}`}>
          {micActive ? <HiOutlineMicrophone size={24} /> : <HiMicrophone size={24} />}
        </button>

        <button onClick={onHangup} className="w-20 h-20 bg-red-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-500/20">
          <HiPhoneMissedCall size={32} />
        </button>

        <button onClick={() => {
          userStream.current.getVideoTracks()[0].enabled = !videoActive;
          setVideoActive(!videoActive);
        }} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${videoActive ? 'bg-white/5' : 'bg-red-500/20 text-red-500'}`}>
          {videoActive ? <HiOutlineVideoCamera size={24} /> : <HiVideoCamera size={24} />}
        </button>
      </div>
    </div>
  );
};

export default GroupCallScreen;