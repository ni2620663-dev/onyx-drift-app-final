import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const Call = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const appID = 905999037
  const serverSecret = "d4e05520e2ee69e3ace35b6beble42";

  const myMeeting = async (element) => {
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, 
      Date.now().toString(), 
      "User_" + Math.floor(Math.random() * 100)
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      showScreenSharingButton: true,
      onLeaveRoom: () => {
        navigate('/messenger'); // কল শেষে মেসেঞ্জারে ব্যাক করবে
      },
    });
  };

  return (
  <div className="w-screen h-screen bg-[#020617] flex items-center justify-center relative">
    {/* ব্যাকগ্রাউন্ডে একটি লোডিং টেক্সট থাকবে যা Zego UI লোড হলে ঢাকা পড়ে যাবে */}
    <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-400 font-black uppercase tracking-widest text-xs">Establishing Secure Link...</p>
    </div>
    
    <div ref={myMeeting} className="w-full h-full z-10" />
  </div>
);
