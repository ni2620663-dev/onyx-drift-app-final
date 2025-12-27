import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";

const VideoCall = () => {
  const { roomId } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth0();
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const myMeeting = async () => {
      // ZegoCloud Credentials
      const appID = 905999037; 
      const serverSecret = "d4e0505520e2ee69e3ace35b6beb1e42"; // কোটেশন মার্ক যোগ করা হয়েছে
      
      // কিট টোকেন জেনারেট করা
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user.sub, // ইউজার আইডি
        user.name || user.nickname || "User" // ইউজারের নাম
      );

      // ভিডিও কল তৈরি করা
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // ১-টু-১ কলের জন্য
        },
        showScreenSharingButton: true,
        showPreJoinView: false, // সরাসরি কলে ঢুকে যাবে
        onLeaveRoom: () => {
          navigate('/messenger'); // কল শেষ হলে মেসেঞ্জারে ফিরে যাবে
        },
      });
    };

    myMeeting();

    // ক্লিনআপ ফাংশন: পেজ থেকে চলে গেলে যেন ক্যামেরা অফ হয়
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [user, roomId, isAuthenticated, isLoading, navigate]);

  if (isLoading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Call...</div>;

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
        {/* কল কন্টেইনার */}
      <div 
        ref={containerRef} 
        className="w-full h-full" 
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
};

export default VideoCall;