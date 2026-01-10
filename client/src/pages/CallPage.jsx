import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";
import { HiOutlineXMark } from "react-icons/hi2";

const CallPage = () => {
  const { roomId } = useParams(); 
  const { user } = useAuth0();
  const navigate = useNavigate();

  // ZegoCloud Credentials
  const appID = 1086315716;
  const serverSecret = "f0c34875a613274b39afc9b10d6f54a720d8212c57e83423ae902e54458bbd92"; 

  const myMeeting = async (element) => {
    if (!element || !roomId) return;

    try {
      /**
       * গুরুত্বপূর্ণ: ZegoCloud UserID তে স্পেশাল ক্যারেক্টার (যেমন: auth0|...) সাপোর্ট করে না।
       * তাই আমরা ID থেকে শুধু অক্ষর এবং সংখ্যা রেখে বাকি সব "_" দিয়ে বদলে দিচ্ছি।
       */
      const cleanUserID = user?.sub 
        ? user.sub.replace(/[^a-zA-Z0-9_]/g, "_") 
        : `user_${Math.floor(Math.random() * 10000)}`;

      const userName = user?.name || "Nexus User";

      // ১. টোকেন জেনারেট করা
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        roomId, 
        cleanUserID, 
        userName
      );

      // ২. কলিং ইন্টারফেস তৈরি করা
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      zp.joinRoom({
        container: element,
        sharedLinks: [
          {
            name: 'Personal link',
            url: window.location.origin + window.location.pathname,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, 
        },
        showScreenSharingButton: true,
        showPreJoinView: false, // সরাসরি কলে ঢোকার জন্য এটি false রাখতে পারেন
        onLeaveRoom: () => {
          navigate(-1); 
        },
      });
    } catch (error) {
      console.error("Zego Initialization Error:", error);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] flex flex-col overflow-hidden">
      {/* HUD / টপ বার */}
      <div className="absolute top-0 left-0 w-full p-6 z-[999] flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div>
            <h2 className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs">Secure Channel</h2>
            <p className="text-white/40 text-[9px] font-mono">ID: {roomId?.substring(0, 8)}... ENCRYPTED</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-red-500/40 hover:border-red-500/50 transition-all pointer-events-auto shadow-2xl"
        >
          <HiOutlineXMark size={24} />
        </button>
      </div>

      {/* ভিডিও কন্টেইনার */}
      <div 
        ref={myMeeting} 
        className="zego-view-container w-full h-full"
        style={{ width: '100vw', height: '100vh' }}
      ></div>

      {/* স্টাইল ওভাররাইড (Zego-র ডিফল্ট সাদা ব্যাকগ্রাউন্ড কালো করার জন্য) */}
      <style>{`
        .zego-view-container div {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default CallPage;