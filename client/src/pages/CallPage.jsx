import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";
import { HiOutlineXMark } from "react-icons/hi2";

const CallPage = ({ socket }) => { // <--- সকেট প্রপস হিসেবে নেওয়া হয়েছে
  const { roomId } = useParams(); 
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3")); // একটি স্যাম্পল রিংটোন

  // ✅ ZegoCloud Credentials
  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  useEffect(() => {
    const initMeeting = async () => {
      if (!roomId || !isAuthenticated || !user) return;

      try {
        // ১. ইউজার আইডি ক্লিন করা
        const cleanUserID = user.sub.replace(/[^a-zA-Z0-9_]/g, "_");
        const userName = user.name || "Onyx Drifter";

        // ২. কিট টোকেন জেনারেট করা
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId, 
          cleanUserID, 
          userName
        );

        // ৩. কলিং ইন্টারফেস তৈরি করা
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        // ৪. রিংটোন বাজানো (কল রুমে ঢোকার আগে)
        ringtoneRef.current.loop = true;
        ringtoneRef.current.play().catch(err => console.log("Ringtone play blocked by browser"));

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
          onUserJoin: () => {
            // কেউ জয়েন করলে রিংটোন বন্ধ হবে
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
          },
          onLeaveRoom: () => {
            ringtoneRef.current.pause();
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
      ringtoneRef.current.pause();
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
            zpRef.current?.destroy();
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
        .ZEGO_V_W_CONTROL_BAR {
          background: rgba(2, 6, 23, 0.8) !important;
          backdrop-filter: blur(30px) !important;
          border-top: 1px solid rgba(34, 211, 238, 0.1) !important;
          padding-bottom: 30px !important;
        }
        .ZEGO_V_W_VIDEO_PLAYER {
          object-fit: cover !important;
          border-radius: 24px !important;
          border: 2px solid rgba(34, 211, 238, 0.05) !important;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.5) !important;
        }
        .ZEGO_V_W_PREJOIN_VIEW {
           background-color: #020617 !important;
        }
        /* Hide Zego Branding */
        .ZEGO_V_W_LOGO { display: none !important; }
      `}</style>
    </div>
  );
};

export default CallPage;