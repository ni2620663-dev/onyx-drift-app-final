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

  // ZegoCloud Credentials (পাবলিকলি রাখা রিস্কি, পরে .env তে নিয়ে যাবেন)
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
    // Auth লোড না হওয়া পর্যন্ত ওয়েট করা
    if (isAuthLoading || !isAuthenticated || !user || !roomId) return;

    const callAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
    callAudio.loop = true;
    ringtoneRef.current = callAudio;

    const initMeeting = async () => {
      try {
        // ১. ইউজার আইডি ফরম্যাটিং (ZegoCloud শুধুমাত্র আলফানিউমেরিক সাপোর্ট করে)
        // sub আইডি থেকে শুধু লেটার আর নাম্বার রেখে বাকিটা ছেঁটে ফেলা হয়েছে
        const cleanUserId = user.sub.replace(/[^a-zA-Z0-9]/g, "");
        const userName = user.name?.split(' ')[0] || "Drifter";

        // ২. টোকেন জেনারেট (generateKitTokenForTest ব্যবহার করা হয়েছে)
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId, 
          cleanUserId, 
          userName
        );

        // ৩. Zego ইনসট্যান্স তৈরি
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        // ৪. রিংটোন প্লে
        callAudio.play().catch(() => console.log("Audio waiting for user link..."));

        // ৫. রুমে জয়েন
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

          onUserJoin: (users) => {
            console.log("👤 Neural Member Joined");
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
            }
            setIsCallStarted(true); 
          },
          onUserLeave: () => navigate('/messages'),
          onLeaveRoom: () => navigate('/messages'),
        });

      } catch (error) {
        console.error("Zego Initialization Error:", error);
        setErrorMsg(`Neural sync failed: ${error.message || "Unknown error"}`);
      }
    };

    const timer = setTimeout(() => {
      initMeeting();
    }, 800);

    return () => {
      clearTimeout(timer);
      if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.src = "";
      }
    };
  }, [roomId, user, isAuthenticated, isAuthLoading, navigate, callMode]);

  if (isAuthLoading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono animate-pulse uppercase tracking-widest">
      Verifying Identity...
    </div>
  );

  if (errorMsg) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
        <HiOutlineXMark size={32} />
      </div>
      <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Sync Terminated</h2>
      <p className="text-gray-400 text-sm max-w-xs">{errorMsg}</p>
      <button onClick={() => navigate('/messages')} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest">
        Return to Nexus
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[99999] w-full h-screen bg-[#020617] flex flex-col overflow-hidden">
      
      {/* --- 🛰️ NEURAL HUD OVERLAY --- */}
      <div className="absolute top-0 left-0 w-full p-6 z-[100] flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-cyan-500/20">
            <div className="relative w-2.5 h-2.5">
              <div className="w-full h-full bg-cyan-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-full h-full bg-cyan-400 rounded-full relative" />
            </div>
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-[10px]">
              {isCallStarted ? `Neural ${callMode} Active` : `Initializing Link...`}
            </h2>
          </div>

          {isCallStarted && (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-lg px-4 py-1.5 rounded-xl border border-white/10 w-fit"
            >
              <FaClock className="text-cyan-500 text-[10px] animate-pulse" />
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
          className="w-14 h-14 bg-red-500/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-red-500/30 text-red-500 pointer-events-auto hover:bg-red-500 hover:text-white transition-all active:scale-90"
        >
          <HiOutlineXMark size={28} />
        </button>
      </div>

      {/* --- 🎙️ AUDIO MODE UI (Background) --- */}
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
               <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em]">Encrypted Voice Only</p>
            </div>
          </div>
        </div>
      )}

      {/* --- 🎥 ZEGO UI CONTAINER --- */}
      <div 
        ref={containerRef} 
        className={`zego-container w-full h-full ${callMode === 'audio' ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
      ></div>

      {/* --- 💅 CUSTOM UI OVERRIDES --- */}
      <style>{`
        .zego-container { background-color: #020617 !important; }
        
        /* কন্ট্রোল বার ডিজাইন */
        .ZEGO_V_W_CONTROL_BAR {
          bottom: 40px !important;
          background: rgba(2, 6, 23, 0.85) !important;
          backdrop-filter: blur(24px) !important;
          border-radius: 30px !important;
          border: 1px solid rgba(34, 211, 238, 0.15) !important;
          padding: 10px 20px !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
        }

        /* অপ্রয়োজনীয় এলিমেন্ট হাইড করা */
        .ZEGO_V_W_LOGO, .ZEGO_V_W_TOP_BAR, .ZEGO_V_W_USER_LIST, .ZEGO_V_W_SETTING_MODEL_TITLE { 
          display: none !important; 
        }

        /* লোকাল ভিডিও প্রিভিউ পজিশনিং */
        ${isCallStarted && callMode === 'video' ? `
          .ZEGO_V_W_LOCAL_VIDEO {
            position: absolute !important;
            right: 20px !important;
            top: 100px !important;
            width: 110px !important;
            height: 160px !important;
            border-radius: 20px !important;
            border: 2px solid rgba(6, 182, 212, 0.3) !important;
            overflow: hidden !important;
            z-index: 50 !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
          }
        ` : ""}
      `}</style>
    </div>
  );
};

export default CallPage;