import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const Call = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const appID = 905999037
  const serverSecret = "";

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
    <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
      <div ref={myMeeting} className="w-full h-full" />
    </div>
  );
};

export default Call;