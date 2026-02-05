import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";

const Call = () => {
  const { roomId } = useParams();
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  
  const videoContainerRef = useRef(null);
  const isJoined = useRef(false);
  const zpInstance = useRef(null);

  const appID = 1086315716;
  const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  useEffect(() => {
    const initCall = async () => {
      // ইউজার অথেনটিকেটেড না হওয়া পর্যন্ত বা কন্টেইনার রেডি না হওয়া পর্যন্ত অপেক্ষা করবে
      if (isJoined.current || !videoContainerRef.current || !isAuthenticated || !user) return;
      isJoined.current = true; 

      try {
        // Auth0 ID থেকে স্পেশাল ক্যারেক্টার রিমুভ করা (ZegoCloud-এর জন্য প্রয়োজন)
        const cleanUserID = user.sub.replace(/[^a-zA-Z0-9_]/g, "_");
        const userName = user.name || "Neural Drifter";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId, 
          cleanUserID, 
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpInstance.current = zp;
        
        zp.joinRoom({
          container: videoContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, 
          },
          showScreenSharingButton: false,
          showPreJoinView: false, // সরাসরি জয়েন
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showUserList: false,
          showLayoutButton: false,
          showTextChat: false, // মেসেঞ্জারে চ্যাট থাকায় এখানে অফ রাখা হয়েছে ক্লিনার লুকের জন্য
          showAudioVideoSettingsButton: true,
          maxUsers: 2,
          layout: "Auto", 
          
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
        zpInstance.current = null;
      }
    };

    if (isAuthenticated) {
      initCall();
    }

    return () => {
      handleCleanup();
    };
  }, [roomId, navigate, user, isAuthenticated]);

  return (
    <div className="w-screen h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden fixed inset-0 z-[9999]">
      
      {/* লোডার এনিমেশন - ভিডিও লোড হওয়ার আগে দেখাবে */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0 bg-[#020617]">
          <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
          <div className="text-center">
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">
              Establishing Neural Link
            </h2>
            <p className="text-white/20 text-[8px] mt-2 uppercase tracking-widest">Room ID: {roomId?.slice(-8)}</p>
          </div>
      </div>
      
      {/* Zego UI Container */}
      <div 
        ref={videoContainerRef} 
        className="w-full h-full z-10" 
      />

      {/* 🛠️ CSS Overrides for Premium Mobile UI */}
      <style>{`
        /* ভিডিও ফুল স্ক্রিন ফিক্স */
        .zego-view-container video {
          object-fit: cover !important;
          background-color: #020617 !important;
        }

        /* রিমোট ভিডিও (অন্য জনের ফেস) ফুল স্ক্রিন */
        .ZEGO_V_W_REMOTE_VIDEO {
          height: 100% !important;
          width: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }

        /* নিজের ভিডিও (পিপ ইন পিপ মোড) */
        .ZEGO_V_W_LOCAL_VIDEO {
          width: 120px !important;
          height: 180px !important;
          right: 20px !important;
          top: 20px !important;
          border-radius: 20px !important;
          border: 2px solid rgba(34, 211, 238, 0.3) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
          z-index: 100 !important;
        }

        /* কন্ট্রোল বার মডার্ন স্টাইল */
        .ZEGO_V_W_CONTROL_BAR {
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 100px !important;
          bottom: 40px !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          padding: 12px 24px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: fit-content !important;
          display: flex !important;
          gap: 15px !important;
        }

        /* অপ্রয়োজনীয় এলিমেন্ট হাইড করা */
        .ZEGO_V_W_LOGO, .ZEGO_V_W_POWERED_BY, .ZEGO_V_W_TOP_BAR {
          display: none !important;
        }

        /* বাটন স্টাইল */
        .ZEGO_V_W_CONTROL_BAR_BTN {
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 50% !important;
          padding: 10px !important;
        }

        .ZEGO_V_W_CONTROL_BAR_BTN_HANGUP {
          background: #ef4444 !important;
        }
      `}</style>
    </div>
  );
};

export default Call;