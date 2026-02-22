import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";
import { HiOutlineXMark } from "react-icons/hi2";
import { FaClock, FaMicrophone } from "react-icons/fa";
import { motion } from "framer-motion";

const CallPage = () => { 
  const { roomId } = useParams(); 
  const location = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const ringtoneRef = useRef(null);
  
  const [duration, setDuration] = useState(0);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const callMode = queryParams.get('mode') || 'video'; 

  // ZegoCloud Credentials
  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  /* =================⏳ TIMER LOGIC ================= */
  useEffect(() => {
    let interval = null;
    if (isCallStarted) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /* =================🛰️ NEURAL LINK ENGINE ================= */
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user || !roomId) return;

    const callAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
    callAudio.loop = true;
    ringtoneRef.current = callAudio;

    const initMeeting = async () => {
      try {
        // 🛡️ ইউজার আইডি ক্লিন করা (Strict Regex: শুধু সংখ্যা বা লেটার থাকবে)
        // google-oauth2|123456 -> 123456 (বা শুধু শেষ ১০টি ক্যারেক্টার)
        const cleanUserId = user.sub.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
        const cleanUserName = (user.name || "Drifter").split(' ')[0].replace(/[^a-zA-Z0-9]/g, "");

        // ২. টোকেন জেনারেট (AppID কে অবশ্যই Number হতে হবে)
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          Number(appID), 
          serverSecret, 
          roomId, 
          cleanUserId, 
          cleanUserName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        callAudio.play().catch(() => console.log("Waiting for interaction..."));

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, 
          },
          showScreenSharingButton: false, 
          showPreJoinView: false, 
          showUserList: false,
          maxUsers: 2,
          layout: "Grid", 
          showLayoutButton: false,
          showAudioVideoSettingsButton: true,
          showTextChat: false,
          showNonVideoUser: true, 
          turnOnCameraWhenJoining: callMode === 'video', 
          turnOnMicrophoneWhenJoining: true, 
          useFrontFacingCamera: true,

          onUserJoin: () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
            setIsCallStarted(true); 
          },
          onUserLeave: () => navigate('/messages'),
          onLeaveRoom: () => navigate('/messages'),
        });

      } catch (error) {
        console.error("Zego Error:", error);
        setErrorMsg("Neural link failed. AppID or Token invalid.");
      }
    };

    const timer = setTimeout(initMeeting, 1000);

    return () => {
      clearTimeout(timer);
      if (zpRef.current) zpRef.current.destroy();
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.src = "";
      }
    };
  }, [roomId, user, isAuthenticated, isAuthLoading, navigate, callMode]);

  if (isAuthLoading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono animate-pulse uppercase">
      Scanning Identity...
    </div>
  );

  if (errorMsg) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
        <HiOutlineXMark size={32} />
      </div>
      <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Link Error</h2>
      <p className="text-gray-400 text-sm max-w-xs">{errorMsg}</p>
      <button onClick={() => navigate('/messages')} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest">
        Back to Nexus
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[99999] w-full h-screen bg-[#020617] flex flex-col overflow-hidden">
      
      {/* HUD OVERLAY */}
      <div className="absolute top-0 left-0 w-full p-6 z-[100] flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-cyan-500/20">
            <div className="relative w-2.5 h-2.5">
              <div className="w-full h-full bg-cyan-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-full h-full bg-cyan-400 rounded-full relative" />
            </div>
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-[10px]">
              {isCallStarted ? `Neural ${callMode} Active` : `Initializing...`}
            </h2>
          </div>

          {isCallStarted && (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-lg px-4 py-1.5 rounded-xl border border-white/10 w-fit"
            >
              <FaClock className="text-cyan-500 text-[10px]" />
              <span className="text-white font-mono text-sm font-bold tracking-widest">
                {formatTime(duration)}
              </span>
            </motion.div>
          )}
        </div>
        
        <button 
          onClick={() => {
            if (zpRef.current) zpRef.current.destroy();
            navigate('/messages');
          }}
          className="w-14 h-14 bg-red-500/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-red-500/30 text-red-500 pointer-events-auto hover:bg-red-500 transition-all active:scale-90"
        >
          <HiOutlineXMark size={28} />
        </button>
      </div>

      {/* AUDIO MODE UI */}
      {callMode === 'audio' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse" />
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}
               className="w-32 h-32 rounded-full border-2 border-cyan-500/50 p-1 relative z-20 overflow-hidden"
            >
               <img src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Onyx"} className="w-full h-full rounded-full object-cover grayscale opacity-80" alt="Caller" />
            </motion.div>
            <div className="mt-8 flex flex-col items-center gap-2">
               <FaMicrophone className="text-cyan-500 animate-bounce" />
               <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em]">Encrypted Pulse</p>
            </div>
          </div>
        </div>
      )}

      {/* ZEGO CONTAINER */}
      <div 
        ref={containerRef} 
        className={`zego-container w-full h-full ${callMode === 'audio' ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
      ></div>

      <style>{`
        .zego-container { background-color: #020617 !important; }
        .ZEGO_V_W_CONTROL_BAR {
          bottom: 30px !important;
          background: rgba(2, 6, 23, 0.8) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 30px !important;
          border: 1px solid rgba(34, 211, 238, 0.1) !important;
          padding: 8px 15px !important;
        }
        .ZEGO_V_W_LOGO, .ZEGO_V_W_TOP_BAR, .ZEGO_V_W_USER_LIST { display: none !important; }
        ${isCallStarted && callMode === 'video' ? `
          .ZEGO_V_W_LOCAL_VIDEO {
            position: absolute !important;
            right: 20px !important;
            top: 100px !important;
            width: 100px !important;
            height: 150px !important;
            border-radius: 15px !important;
            border: 1px solid rgba(6, 182, 212, 0.3) !important;
          }
        ` : ""}
      `}</style>
    </div>
  );
};

export default CallPage;