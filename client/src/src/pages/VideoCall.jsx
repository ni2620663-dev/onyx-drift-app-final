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
    // ইউজার ডাটা লোড না হওয়া পর্যন্ত অপেক্ষা করবে
    if (isLoading || !isAuthenticated || !user) return;

    const myMeeting = async () => {
      // ZegoCloud Credentials (আপনার ড্যাশবোর্ড থেকে প্রাপ্ত)
     
      const appID = 1086315716
 const serverSecret = "faa9451e78f290d4a11ff8eb53c79bea"; 

  
      // কিট টোকেন জেনারেট করা
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user.sub, // ইউনিক ইউজার আইডি (Auth0 থেকে প্রাপ্ত)
        user.name || "User" // ইউজারের নাম
      );

      // ভিডিও কল অবজেক্ট তৈরি করা
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      // কল জয়েন করা
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // ১-টু-১ কলের জন্য
        },
        showScreenSharingButton: true,
        showPreJoinView: false, // সরাসরি কলে প্রবেশ করবে
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        onLeaveRoom: () => {
          // কল লিভ করলে মেসেঞ্জারে পাঠিয়ে দিবে
          navigate('/messenger'); 
        },
      });
    };

    myMeeting();

    // ক্লিনআপ ফাংশন
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [user, roomId, isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p>Connecting to secure call...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* ভিডিও কল কন্টেইনার */}
      <div 
        ref={containerRef} 
        className="w-full h-full" 
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
};

export default VideoCall;