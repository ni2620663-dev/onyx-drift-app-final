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
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const ringtoneRef = useRef(null);
  
  const [duration, setDuration] = useState(0);
  const [isCallStarted, setIsCallStarted] = useState(false);

  // URL থেকে কল মোড বের করা (audio অথবা video)
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /* =================🛰️ NEURAL LINK ENGINE ================= */
  useEffect(() => {
    const callAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
    callAudio.loop = true;
    ringtoneRef.current = callAudio;

    const initMeeting = async () => {
      if (!roomId || !isAuthenticated || !user || !containerRef.current) return;

      try {
        const userId = user.sub.split('|').pop() || user.sub.replace(/[^a-zA-Z0-9]/g, "");
        const userName = user.name || "Onyx Drifter";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId, 
          userId, 
          userName
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
          // 💡 মোড অনুযায়ী ক্যামেরা কন্ট্রোল
          turnOnCameraWhenJoining: callMode === 'video', 
          turnOnMicrophoneWhenJoining: true, 
          useFrontFacingCamera: true,

          onUserJoin: () => {
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
            }
            setIsCallStarted(true); 
          },
          onUserLeave: () => navigate('/messages'),
          onLeaveRoom: () => navigate('/messages'),
        });
      } catch (error) {
        console.error("Zego Neural Link Error:", error);
      }
    };

    initMeeting();

    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.src = "";
      }
    };
  }, [roomId, user, isAuthenticated, navigate, callMode]);

  return (
    <div className="fixed inset-0 z-[99999] w-full h-screen bg-[#020617] flex flex-col overflow-hidden">
      
      {/* --- 🛰️ NEURAL HUD OVERLAY --- */}
      <div className="absolute top-0 left-0 w-full p-6 z-[100] flex justify-between items-start pointer-events-none">
        
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Status Badge */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="relative w-2.5 h-2.5">
              <div className="w-full h-full bg-cyan-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-full h-full bg-cyan-400 rounded-full relative" />
            </div>
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-[10px]">
              {isCallStarted ? `Neural ${callMode} Active` : `Scanning Grid...`}
            </h2>
          </div>

          {/* Call Duration */}
          {isCallStarted && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-lg px-4 py-1.5 rounded-xl border border-white/10 w-fit"
            >
              <FaClock className="text-cyan-500 text-[10px] animate-pulse" />
              <span className="text-white font-mono text-sm font-bold tracking-widest">
                {formatTime(duration)}
              </span>
            </motion.div>
          )}
        </div>
        
        {/* End Call Button */}
        <button 
          onClick={() => {
            if (zpRef.current) zpRef.current.destroy();
            navigate('/messages');
          }}
          className="w-14 h-14 bg-red-500/10 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center border border-red-500/30 text-red-500 pointer-events-auto hover:bg-red-500 hover:text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.15)] active:scale-90"
        >
          <HiOutlineXMark size={28} />
        </button>
      </div>

      {/* --- 🎙️ AUDIO MODE SPECIAL UI (Only visible if mode is audio) --- */}
      {callMode === 'audio' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse" />
            <motion.div 
               animate={{ scale: [1, 1.1, 1] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="w-32 h-32 rounded-full border-2 border-cyan-500/50 p-1 relative z-20"
            >
               <img 
                 src={user?.picture || "https://ui-avatars.com/api/?name=User"} 
                 className="w-full h-full rounded-full object-cover grayscale opacity-80" 
                 alt="Caller"
               />
            </motion.div>
            <div className="mt-8 flex flex-col items-center gap-2">
               <FaMicrophone className="text-cyan-500 animate-bounce" />
               <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">Encrypted Audio Line</p>
            </div>
          </div>
        </div>
      )}

      {/* --- 🎥 ZEGO VIDEO ENGINE --- */}
      <div ref={containerRef} className={`zego-container w-full h-full ${callMode === 'audio' ? 'opacity-0' : 'opacity-100'}`}></div>

      {/* --- 🛠️ CUSTOM CSS --- */}
      <style>{`
        .zego-container { background-color: #020617 !important; }
        .ZEGO_V_W_VIDEO_PLAYER { background: #020617 !important; }
        video { object-fit: cover !important; }

        .ZEGO_V_W_CONTROL_BAR {
          bottom: 40px !important;
          background: rgba(2, 6, 23, 0.8) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 30px !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          height: 80px !important;
          width: fit-content !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          padding: 0 25px !important;
          z-index: 1000 !important;
        }

        .ZEGO_V_W_LOGO, .ZEGO_V_W_TOP_BAR, .ZEGO_V_W_USER_LIST { display: none !important; }

        /* PIP Style for Video Call */
        ${isCallStarted && callMode === 'video' ? `
          .ZEGO_V_W_LOCAL_VIDEO {
            position: absolute !important;
            right: 20px !important;
            top: 100px !important;
            width: 110px !important;
            height: 160px !important;
            z-index: 100 !important;
            border: 1px solid rgba(6, 182, 212, 0.4) !important;
            border-radius: 20px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important;
          }
        ` : ""}
        
        /* Hide local video if Audio Mode */
        ${callMode === 'audio' ? `
          .ZEGO_V_W_LOCAL_VIDEO, .ZEGO_V_W_REMOTE_VIDEO { display: none !important; }
          .ZEGO_V_W_CONTROL_BAR_BUTTON_VIDEO { display: none !important; }
        ` : ""}
      `}</style>
    </div>
  );
};

export default CallPage;