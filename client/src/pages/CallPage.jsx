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

  // ZegoCloud Credentials
  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  useEffect(() => {
    // অডিও অবজেক্ট ইনিশিয়ালাইজ (ব্রাউজার পলিসি অনুযায়ী)
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

        // রিংটোন প্লে করার চেষ্টা (User Interaction ছাড়া ব্লক হতে পারে)
        const playPromise = ringtoneRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log("Autoplay blocked: Ringtone will play after user interaction");
          });
        }

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: 'Invite link',
              url: window.location.origin + `/call/${roomId}`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showScreenSharingButton: true,
          showPreJoinView: false,
          showUserList: false,
          maxUsers: 2,
          layout: "Auto", 
          showLayoutButton: false,
          // ভিডিও রেন্ডারিং এবং রিংটোন লজিক
          onUserJoin: (users) => {
            // কেউ জয়েন করলে রিংটোন বন্ধ হবে
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current.currentTime = 0;
            }
          },
          onUserLeave: () => {
             // অন্য ইউজার চলে গেলে কল কেটে যাবে
             navigate('/messenger');
          },
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
      if (zpRef.current) {
        zpRef.current.destroy();
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.src = "";
      }
    };
  }, [roomId, user, isAuthenticated, navigate]);

  return (
    <div className="relative w-full h-screen bg-[#020617] flex flex-col overflow-hidden fixed inset-0 z-[99999]">
      
      {/* 🛰️ Cyber HUD Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-[9999] flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="relative">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-ping absolute inset-0" />
            <div className="w-3 h-3 bg-cyan-400 rounded-full relative" />
          </div>
          <div>
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.4em] text-[10px]">Neural Link Active</h2>
            <p className="text-white/30 text-[8px] font-mono uppercase tracking-widest">Node ID: {roomId?.substring(0, 12)}</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (zpRef.current) zpRef.current.destroy();
            navigate('/messenger');
          }}
          className="w-12 h-12 bg-white/5 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/10 text-white hover:bg-red-500 hover:text-white transition-all pointer-events-auto shadow-2xl group"
        >
          <HiOutlineXMark size={24} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* 🎥 Zego Video Container */}
      <div 
        ref={containerRef} 
        className="zego-container w-full h-full"
      ></div>

      {/* 🎨 CSS Overrides for Cyberpunk UI */}
      <style>{`
        .zego-container {
          background-color: #020617 !important;
        }
        /* অন্য ইউজারকে বড় করে দেখানোর জন্য ভিডিও রেন্ডার সেটিংস */
        .ZEGO_V_W_VIDEO_PLAYER video {
          object-fit: cover !important;
          background: #020617 !important;
        }
        .ZEGO_V_W_CONTROL_BAR {
          background: rgba(2, 6, 23, 0.8) !important;
          backdrop-filter: blur(30px) !important;
          border-top: 1px solid rgba(34, 211, 238, 0.1) !important;
          padding-bottom: 30px !important;
        }
        .ZEGO_V_W_VIDEO_PLAYER {
          border-radius: 24px !important;
          border: 2px solid rgba(34, 211, 238, 0.1) !important;
          overflow: hidden !important;
        }
        /* Hide Zego Branding */
        .ZEGO_V_W_LOGO { display: none !important; }
        .ZEGO_V_W_PREJOIN_VIEW { background: #020617 !important; }
      `}</style>
    </div>
  );
};

export default CallPage;