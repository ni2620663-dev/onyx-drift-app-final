import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";
import { HiOutlineXMark } from "react-icons/hi2";
import { FaClock } from "react-icons/fa";

const CallPage = () => { 
  const { roomId } = useParams(); 
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const ringtoneRef = useRef(null);
  
  // ⏱️ Timer State
  const [duration, setDuration] = useState(0);
  const [isCallStarted, setIsCallStarted] = useState(false);

  // ZegoCloud Credentials
  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  // টাইমার লজিক
  useEffect(() => {
    let interval = null;
    if (isCallStarted) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCallStarted]);

  // সেকেন্ডকে MM:SS ফরম্যাটে রূপান্তর
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // রিংটোন সেটআপ
    ringtoneRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
    ringtoneRef.current.loop = true;

    const initMeeting = async () => {
      if (!roomId || !isAuthenticated || !user) return;

      try {
        const cleanUserID = user.sub.replace(/[^a-zA-Z0-9_]/g, "_");
        const userName = user.name || "Onyx Drifter";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId, 
          cleanUserID, 
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        // ব্রাউজার পলিসি অনুযায়ী রিংটোন প্লে
        ringtoneRef.current.play().catch(() => console.log("Audio play blocked"));

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
          turnOnCameraWhenJoining: true, 
          turnOnMicrophoneWhenJoining: true, 
          useFrontFacingCamera: true,

          onUserJoin: (users) => {
            // অন্য কেউ জয়েন করলেই রিংটোন বন্ধ এবং টাইমার শুরু
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
            }
            setIsCallStarted(true); 
          },
          onUserLeave: () => navigate('/messages'),
          onLeaveRoom: () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
            navigate('/messages');
          },
        });
      } catch (error) {
        console.error("Zego Initialization Error:", error);
      }
    };

    initMeeting();

    return () => {
      if (zpRef.current) zpRef.current.destroy();
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.src = "";
      }
    };
  }, [roomId, user, isAuthenticated, navigate]);

  return (
    <div className="fixed inset-0 z-[99999] w-full h-screen bg-[#020617] flex flex-col overflow-hidden">
      
      {/* 🛰️ Mobile HUD Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-[9999] flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        
        {/* Connection Status & Timer */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30">
            <div className="relative w-2 h-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full relative" />
            </div>
            <h2 className="text-cyan-400 font-black uppercase tracking-widest text-[9px]">
              {isCallStarted ? "Link Established" : "Signal Scanning..."}
            </h2>
          </div>

          {/* ⏱️ Call Duration Timer Display */}
          {isCallStarted && (
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 w-fit">
              <FaClock className="text-cyan-500 text-[10px] animate-pulse" />
              <span className="text-white font-mono text-xs font-bold tracking-tighter">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>
        
        {/* End Call Button */}
        <button 
          onClick={() => {
            if (zpRef.current) zpRef.current.destroy();
            navigate('/messages');
          }}
          className="w-12 h-12 bg-red-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-red-500/40 text-red-500 pointer-events-auto active:scale-75 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <HiOutlineXMark size={24} />
        </button>
      </div>

      {/* 🎥 Video Container */}
      <div ref={containerRef} className="zego-container w-full h-full"></div>

      {/* 🎨 Advanced CSS Fixes */}
      <style>{`
        .zego-container { background-color: #020617 !important; }
        
        /* Video Scaling */
        .ZEGO_V_W_VIDEO_PLAYER video {
          object-fit: cover !important;
          border-radius: 0px !important;
        }

        /* Control Bar styling */
        .ZEGO_V_W_CONTROL_BAR {
          bottom: 40px !important;
          background: rgba(15, 23, 42, 0.8) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 30px !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          height: 70px !important;
          padding: 0 20px !important;
        }

        /* Hide Unnecessary UI */
        .ZEGO_V_W_LOGO, .ZEGO_V_W_TOP_BAR, .ZEGO_V_W_PREJOIN_VIEW { 
          display: none !important; 
        }

        /* PIP Mode for local user (When connected) */
        ${isCallStarted ? `
          .ZEGO_V_W_LOCAL_VIDEO {
            position: absolute !important;
            right: 16px !important;
            top: 100px !important;
            width: 100px !important;
            height: 150px !important;
            z-index: 100 !important;
            border: 2px solid rgba(6, 182, 212, 0.5) !important;
            border-radius: 16px !important;
            overflow: hidden !important;
            box-shadow: 0 15px 30px rgba(0,0,0,0.7) !important;
          }
        ` : ""}

        .ZEGO_V_W_REMOTE_VIDEO {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default CallPage;