import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Peer from 'simple-peer';
import { io } from "socket.io-client";
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaVideo, FaPhoneSlash, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import { useAuth0 } from "@auth0/auth0-react";

const socket = io("https://onyx-drift-app-final-u29m.onrender.com", {
  transports: ["websocket"],
});

const CallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth0();

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

  useEffect(() => {
    // ১. মিডিয়া পারমিশন এবং কল সেটআপ
    const setupMedia = async () => {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: !isAudioOnly, 
          audio: true 
        });
        
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // যদি কল রিসিভার হয় (signalData URL এ আছে কিনা চেক করা যেতে পারে, অথবা সকেটের মাধ্যমে)
        // তবে আপনার লজিক অনুযায়ী যদি remoteUserId থাকে তবেই কল শুরু হবে (Caller)
        if (remoteUserId) {
          startCall(currentStream, remoteUserId);
        }
      } catch (err) {
        console.error("Media Error:", err);
      }
    };

    setupMedia();

    // ২. সকেট লিসেনারস
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    // ইনকামিং সিগন্যাল হ্যান্ডেল করা (Answerer এর জন্য)
    socket.on("incomingSignal", (signal) => {
        if (connectionRef.current) {
            connectionRef.current.signal(signal);
        }
    });

    socket.on("callEnded", () => {
      endCallLocally();
    });

    return () => {
      socket.off("callAccepted");
      socket.off("incomingSignal");
      socket.off("callEnded");
      // কম্পোনেন্ট আনমাউন্ট হলে সব ট্র্যাক বন্ধ করা
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [remoteUserId, isAudioOnly]);

  const startCall = (myStream, targetId) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: myStream,
      config: { 
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ] 
      }
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: targetId,
        signalData: data,
        from: user?.sub,
        name: user?.name,
        pic: user?.picture,
        type: isAudioOnly ? 'audio' : 'video',
        roomId: roomId
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    connectionRef.current = peer;
  };

  const endCallLocally = () => {
    if (callEnded) return; // ডাবল কল রোধে
    setCallEnded(true);
    if (connectionRef.current) connectionRef.current.destroy();
    if (stream) stream.getTracks().forEach(track => track.stop());
    navigate('/messages');
  };

  const handleEndCall = () => {
    socket.emit("endCall", { to: remoteUserId });
    endCallLocally();
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleVideo = () => {
    if (stream && !isAudioOnly) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCamOn;
        setIsCamOn(!isCamOn);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] overflow-hidden flex flex-col items-center justify-center font-mono">
      
      {/* 📸 Remote Video */}
      <AnimatePresence>
        {callAccepted && !callEnded ? (
          <motion.video 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            playsInline 
            ref={userVideo} 
            autoPlay 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                <img src={user?.picture} className="w-24 h-24 rounded-full absolute top-4 left-4 object-cover" alt="caller" />
            </div>
            <div className="text-cyan-500 animate-pulse text-sm tracking-[0.3em] font-black uppercase text-center px-4">
              Establishing Neural Link...
            </div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 📹 My Video Overlay */}
      <motion.div 
        drag 
        dragConstraints={{ left: -300, right: 300, top: -400, bottom: 400 }}
        className="absolute top-10 right-10 w-32 h-44 md:w-40 md:h-56 rounded-3xl border-2 border-cyan-500 overflow-hidden z-50 bg-black shadow-2xl cursor-move shadow-cyan-500/20"
      >
        <video 
           playsInline 
           muted 
           ref={myVideo} 
           autoPlay 
           className={`w-full h-full object-cover ${!isCamOn ? 'hidden' : ''}`} 
        />
        {!isCamOn && (
           <div className="w-full h-full flex items-center justify-center bg-zinc-900">
             <img src={user?.picture} className="w-12 h-12 rounded-full opacity-30" alt="avatar" />
           </div>
        )}
      </motion.div>

      {/* 🛠️ Modern Controls */}
      <motion.div 
        initial={{ y: 100 }} 
        animate={{ y: 0 }}
        className="absolute bottom-10 flex gap-4 md:gap-6 items-center bg-black/60 backdrop-blur-2xl px-6 py-4 rounded-[35px] border border-white/10 z-[60]"
      >
        <button 
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${!isMicOn ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}
        >
          {isMicOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
        </button>
        
        <button 
          onClick={handleEndCall}
          className="p-5 rounded-3xl bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/40 transition-all active:scale-90"
        >
          <FaPhoneSlash size={24} />
        </button>

        {!isAudioOnly && (
          <button 
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${!isCamOn ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}
          >
            {isCamOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default CallPage;