import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Peer from 'simple-peer'; 
import { io } from "socket.io-client";
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaVideo, FaPhoneSlash, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import { useAuth0 } from "@auth0/auth0-react";
import { useCall } from '../context/CallContext';

// 🛠️ VITE GLOBAL FIX: simple-peer এর 'call' এরর ফিক্স করার জন্য
if (typeof window !== 'undefined' && !window.global) {
    window.global = window;
}

const socket = io("https://onyx-drift-app-final-u29m.onrender.com", {
  transports: ["websocket"],
});

const CallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth0();
  const { call } = useCall();

  const queryParams = new URLSearchParams(location.search);
  const isAudioOnly = queryParams.get('mode') === 'audio';
  const remoteUserId = queryParams.get('to'); 

  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(!isAudioOnly);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: !isAudioOnly ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false, 
          audio: true 
        });
        
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        if (remoteUserId) {
          initiateCall(currentStream, remoteUserId);
        } else if (call.isReceivingCall && call.signal) {
          respondToCall(currentStream, call.signal);
        }
      } catch (err) {
        console.error("Media Access Error:", err);
      }
    };

    setupMedia();

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    socket.on("callEnded", () => {
      endCallLocally();
    });

    return () => {
      socket.off("callAccepted");
      socket.off("callEnded");
      terminateTracks();
    };
  }, []);

  const initiateCall = (myStream, targetId) => {
    // 🛠️ Vite Constructor Fix
    const PeerConstructor = Peer.default || Peer;
    const peer = new PeerConstructor({
      initiator: true,
      trickle: false,
      config: iceServers,
      stream: myStream,
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: targetId,
        signalData: data,
        from: socket.id,
        name: user?.name,
        pic: user?.picture,
        type: isAudioOnly ? 'audio' : 'video',
        roomId: roomId
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    connectionRef.current = peer;
  };

  const respondToCall = (myStream, incomingSignal) => {
    setCallAccepted(true);
    const PeerConstructor = Peer.default || Peer;
    const peer = new PeerConstructor({
      initiator: false,
      trickle: false,
      config: iceServers,
      stream: myStream,
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.signal(incomingSignal);
    connectionRef.current = peer;
  };

  const terminateTracks = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const endCallLocally = () => {
    setCallEnded(true);
    if (connectionRef.current) connectionRef.current.destroy();
    terminateTracks();
    navigate('/messages');
    window.location.reload();
  };

  const handleEndCall = () => {
    const target = remoteUserId || call.from;
    socket.emit("endCall", { to: target });
    endCallLocally();
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (stream && !isAudioOnly) {
      stream.getVideoTracks()[0].enabled = !isCamOn;
      setIsCamOn(!isCamOn);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* 📸 Remote Video Screen */}
      <AnimatePresence>
        {callAccepted && !callEnded ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 w-full h-full bg-black">
            <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-6 z-10">
            <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                <img 
                  src={call.pic || user?.picture} 
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full absolute top-4 left-4 object-cover border border-cyan-500/50" 
                  alt="avatar" 
                />
            </div>
            <div className="text-cyan-500 animate-pulse text-[10px] tracking-[0.4em] font-black uppercase text-center px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-cyan-500/20">
              {callEnded ? "Link Severed" : "Syncing Neural Grid..."}
            </div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 📹 My Video Overlay */}
      <motion.div drag dragConstraints={{ left: -300, right: 300, top: -400, bottom: 400 }} className="absolute top-6 right-6 w-32 h-44 md:w-44 md:h-60 rounded-3xl border border-white/20 overflow-hidden z-50 bg-black shadow-2xl cursor-grab active:cursor-grabbing">
        <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full object-cover mirror ${!isCamOn ? 'hidden' : ''}`} />
        {!isCamOn && (
           <div className="w-full h-full flex items-center justify-center bg-zinc-900">
             <img src={user?.picture} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full opacity-20" alt="avatar" />
           </div>
        )}
      </motion.div>

      {/* 🛠️ Call Controls */}
      <div className="absolute bottom-10 flex gap-4 md:gap-6 items-center bg-zinc-900/80 backdrop-blur-3xl px-8 py-5 rounded-[40px] border border-white/10 z-[60] shadow-2xl">
        <button onClick={toggleMic} className={`p-4 rounded-2xl transition-all ${!isMicOn ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}>
          {isMicOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
        </button>
        
        <button onClick={handleEndCall} className="p-5 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white shadow-2xl shadow-red-500/50 transition-all active:scale-95 group">
          <FaPhoneSlash size={26} className="group-hover:rotate-12 transition-transform" />
        </button>

        {!isAudioOnly && (
          <button onClick={toggleVideo} className={`p-4 rounded-2xl transition-all ${!isCamOn ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}>
            {isCamOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
          </button>
        )}
      </div>

      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
};

export default CallPage;