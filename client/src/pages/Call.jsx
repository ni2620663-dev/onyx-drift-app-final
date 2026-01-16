import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const Call = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const videoContainerRef = useRef(null);
  const isJoined = useRef(false);
  const zpInstance = useRef(null);

  const appID = Number(import.meta.env.VITE_ZEGO_APP_ID) || 1086315716;
  const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "faa9451e78f290d4a11ff8eb53c79bea"; 

  useEffect(() => {
    const initCall = async () => {
      if (isJoined.current || !videoContainerRef.current) return;
      isJoined.current = true; 

      try {
        // ইউনিক ইউজার আইডি জেনারেশন
        const userID = "drifter_" + Math.floor(Math.random() * 10000);
        const userName = "User_" + userID;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId, 
          userID, 
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpInstance.current = zp;
        
        zp.joinRoom({
          container: videoContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, // ১:১ ভিডিও কলের জন্য অপ্টিমাইজড
          },
          // ইন্টারফেস কনফিগারেশন
          showScreenSharingButton: false,
          showPreJoinView: false, // সরাসরি কলে জয়েন হবে
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showUserList: false,
          showLayoutButton: false,
          showTextChat: true,
          showAudioVideoSettingsButton: true,
          maxUsers: 2,
          layout: "Auto", // মোবাইলে অটোমেটিক ফেস অ্যাডজাস্ট করবে
          
          onLeaveRoom: () => {
            handleCleanup();
            navigate('/messages'); 
          },
          onUserLeave: () => {
            handleCleanup();
            navigate('/messages');
          }
        });
      } catch (error) {
        isJoined.current = false;
        console.error("ZegoCloud Initialization Failed:", error);
      }
    };

    const handleCleanup = () => {
      isJoined.current = false;
      if (zpInstance.current) {
        zpInstance.current.destroy();
      }
    };

    initCall();

    return () => {
      handleCleanup();
    };
  }, [roomId, navigate, appID, serverSecret]);

  return (
    <div className="w-screen h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden fixed inset-0 z-[9999]">
      
      {/* লোডার এনিমেশন - ভিডিও লোড হওয়ার আগে দেখাবে */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-[#020617]">
          <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
          <div className="text-center">
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">
              Establishing Neural Link
            </h2>
          </div>
      </div>
      
      {/* Zego UI Container */}
      <div 
        ref={videoContainerRef} 
        className="w-full h-full z-10" 
      />

      {/* 🛠️ CSS Overrides for Premium Mobile UI */}
      <style>{`
        /* ভিডিওর কালো বর্ডার দূর করে ফুল স্ক্রিন করা */
        .zego-view-container video {
          object-fit: cover !important;
          background-color: #020617 !important;
        }

        /* রিমোট ভিডিও (অন্য জনের ফেস) কে ফুল স্ক্রিন অগ্রাধিকার দেওয়া */
        .ZEGO_V_W_REMOTE_VIDEO {
          height: 100% !important;
          width: 100% !important;
        }

        /* কন্ট্রোল বার কে আরও আধুনিক করা */
        .ZEGO_V_W_CONTROL_BAR {
          background: rgba(15, 23, 42, 0.8) !important;
          backdrop-filter: blur(15px) !important;
          border-radius: 50px !important;
          bottom: 40px !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          padding: 10px !important;
        }

        /* লোগো এবং অপ্রয়োজনীয় টেক্সট হাইড করা */
        .ZEGO_V_W_LOGO, .ZEGO_V_W_POWERED_BY {
          display: none !important;
        }

        /* চ্যাট উইন্ডো ফিক্স */
        .ZEGO_V_W_CHAT_PANEL {
          bottom: 110px !important;
          border-radius: 20px !important;
          background: #0f172a !important;
        }
      `}</style>
    </div>
  );
};

export default Call;