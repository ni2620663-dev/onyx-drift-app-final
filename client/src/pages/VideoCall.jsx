import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth0 } from "@auth0/auth0-react";

const VideoCall = () => {
  const { roomId } = useParams();
  const { user } = useAuth0();
  const containerRef = useRef(null);

  useEffect(() => {
    const myMeeting = async () => {
      const appID = 905999037; // আপনার স্ক্রিনশট থেকে প্রাপ্ত ID
      const serverSecret = d4e0505520e2ee69e3ace35b6beb1e42
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user?.sub || Date.now().toString(),
        user?.name || "User"
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showScreenSharingButton: true,
      });
    };

    if (user) myMeeting();
  }, [user, roomId]);

  return (
    <div className="w-full h-screen flex flex-col bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoCall;