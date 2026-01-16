import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";
import { HiOutlineXMark } from "react-icons/hi2";

const CallPage = ({ socket }) => { 
  const { roomId } = useParams(); 
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const ringtoneRef = useRef(null);

  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  useEffect(() => {
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

        ringtoneRef.current.play().catch(() => console.log("Waiting for user interaction to play audio"));

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showScreenSharingButton: false, 
          showPreJoinView: false,
          showUserList: false,
          maxUsers: 2,
          layout: "Grid", // Grid দিলে মোবাইলে ভিডিও উপরে-নিচে বা পাশাপাশি সমানভাবে দেখাবে
          showLayoutButton: false,
          showAudioVideoSettingsButton: true,
          showTextChat: true, // চ্যাট অপশন এনাবল করা হয়েছে
          onUserJoin: () => {
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
            }
          },
          onUserLeave: () => navigate('/messenger'),
          onLeaveRoom: () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
            navigate('/messenger');
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
          <div>
            <h2 className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">Neural Call</h2>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (zpRef.current) zpRef.current.destroy();
            navigate('/messenger');
          }}
          className="w-10 h-10 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-red-500/30 text-red-500 pointer-events-auto"
        >
          <HiOutlineXMark size={20} />
        </button>
      </div>

      {/* 🎥 Video Container */}
      <div 
        ref={containerRef} 
        className="zego-container w-full h-full overflow-hidden"
      ></div>

      {/* 🎨 CSS Overrides for Mobile UI Fix */}
      <style>{`
        .zego-container {
          background-color: #020617 !important;
        }
        
        /* ভিডিও ফুল স্ক্রিন এবং ফেস ভিজিবিলিটি ঠিক করা */
        .ZEGO_V_W_VIDEO_PLAYER video {
          object-fit: cover !important;
        }

        /* মোবাইলে কন্ট্রোল বার ছোট এবং উপরে উঠানো */
        .ZEGO_V_W_CONTROL_BAR {
          bottom: 25px !important;
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 40px !important;
          width: 90% !important;
          left: 5% !important;
          height: 60px !important;
          padding: 0 !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
        }

        /* চ্যাট পপআপ পজিশন ফিক্স */
        .ZEGO_V_W_CHAT_PANEL {
          bottom: 100px !important;
          height: 50% !important;
          background: #0f172a !important;
        }

        /* ভিডিওর ওপর ইউজারের নাম ছোট করা */
        .ZEGO_V_W_USER_NAME {
          font-size: 11px !important;
          background: rgba(0,0,0,0.5) !important;
          padding: 2px 8px !important;
          border-radius: 4px !important;
        }

        .ZEGO_V_W_LOGO { display: none !important; }
        .ZEGO_V_W_PREJOIN_VIEW { background: #020617 !important; }
      `}</style>
    </div>
  );
};

export default CallPage;