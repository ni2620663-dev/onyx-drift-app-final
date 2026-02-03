import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";
import { HiOutlineXMark } from "react-icons/hi2";

const CallPage = () => { 
  const { roomId } = useParams(); 
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const ringtoneRef = useRef(null);

  // ZegoCloud Credentials
  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

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

        // কল শুরু হলে রিংটোন প্লে হবে
        ringtoneRef.current.play().catch(() => console.log("Audio play blocked by browser"));

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, // এটি নিশ্চিত করে ২ জনের ভিডিও ফিড
          },
          showScreenSharingButton: false, 
          showPreJoinView: false, 
          showUserList: false,
          maxUsers: 2,
          layout: "Grid", // 'Auto' থেকে 'Grid' এ পরিবর্তন করা হলো যাতে ২ জনের ভিডিও সমানভাবে দেখা যায়
          showLayoutButton: false,
          showAudioVideoSettingsButton: true,
          showTextChat: false,
          showNonVideoUser: true, 
          showTurnOffRemoteCameraButton: false, 
          showTurnOffRemoteMicrophoneButton: false,
          turnOnCameraWhenJoining: true, // জয়েন করার সময় ক্যামেরা অন থাকবে
          turnOnMicrophoneWhenJoining: true, // জয়েন করার সময় মাইক অন থাকবে
          useFrontFacingCamera: true, // মোবাইলে ফ্রন্ট ক্যামেরা ব্যবহার করবে

          onUserJoin: (users) => {
            // অন্য কেউ জয়েন করলেই রিংটোন বন্ধ হবে
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
            }
          },
          onUserLeave: () => {
            navigate('/messages');
          },
          onLeaveRoom: () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
            navigate('/messages');
          },
        });
      } catch (error) {
        console.error("Zego Initialization Error:", error);
      }
    };

    if (isAuthenticated) {
      initMeeting();
    }

    return () => {
      if (zpRef.current) zpRef.current.destroy();
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.src = "";
      }
    };
  }, [roomId, user, isAuthenticated, navigate]);

  return (
    <div className="relative w-full h-screen bg-[#020617] flex flex-col overflow-hidden fixed inset-0 z-[99999]">
      
      {/* 🛰️ Mobile HUD Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-[9999] flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping absolute inset-0" />
            <div className="w-2 h-2 bg-cyan-400 rounded-full relative" />
          </div>
          <h2 className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">Neural Grid Active</h2>
        </div>
        
        <button 
          onClick={() => {
            if (zpRef.current) zpRef.current.destroy();
            navigate('/messages');
          }}
          className="w-10 h-10 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-red-500/30 text-red-500 pointer-events-auto active:scale-90 transition-transform"
        >
          <HiOutlineXMark size={20} />
        </button>
      </div>

      {/* 🎥 Video Container */}
      <div 
        ref={containerRef} 
        className="zego-container w-full h-full"
      ></div>

      {/* 🎨 CSS Fixes for 2-Person Visibility */}
      <style>{`
        .zego-container {
          background-color: #020617 !important;
        }
        
        /* ভিডিও লেআউট মোবাইল ফ্রেন্ডলি করা */
        .ZEGO_V_W_VIDEO_PLAYER video {
          object-fit: cover !important;
          border-radius: 12px !important; /* হালকা রাউন্ডেড কর্নার */
        }

        /* কন্ট্রোল বার ডিজাইন */
        .ZEGO_V_W_CONTROL_BAR {
          bottom: 30px !important;
          background: rgba(15, 23, 42, 0.7) !important;
          backdrop-filter: blur(15px) !important;
          border-radius: 50px !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          padding: 10px 20px !important;
        }

        /* বাটনগুলো বড় করা (টাচ করার সুবিধার জন্য) */
        .ZEGO_V_W_CONTROL_BAR_BTN {
          margin: 0 10px !important;
        }

        /* অপ্রয়োজনীয় UI এলিমেন্ট রিমুভ */
        .ZEGO_V_W_LOGO, .ZEGO_V_W_TOP_BAR, .ZEGO_V_W_PREJOIN_VIEW { 
          display: none !important; 
        }

        /* ২ জন থাকলে একজনের ভিডিও ছোট করে কর্নারে (PIP) দেখানোর স্টাইল */
        .ZEGO_V_W_LOCAL_VIDEO {
            position: absolute !important;
            right: 20px !important;
            top: 80px !important;
            width: 120px !important;
            height: 180px !important;
            z-index: 100 !important;
            border: 2px solid rgba(6, 182, 212, 0.5) !important;
            box-shadow: 0 10px 20px rgba(0,0,0,0.5) !important;
            border-radius: 12px !important;
            overflow: hidden !important;
        }

        .ZEGO_V_W_REMOTE_VIDEO {
            width: 100% !important;
            height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default CallPage;