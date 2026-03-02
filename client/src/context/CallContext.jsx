import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

// 🛠️ VITE/ESM GLOBAL FIX: simple-peer এর ইন্টারনাল ক্রাশ ঠেকানোর জন্য
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

const SocketContext = createContext();

// সকেট কানেকশন
const socket = io('https://onyx-drift-app-final-u29m.onrender.com', {
  transports: ['websocket'],
  secure: true,
  autoConnect: true
});

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  
  // ✅ Initial state হিসেবে একটি অবজেক্ট দেওয়া হয়েছে যাতে undefined এরর না আসে
  const [call, setCall] = useState({ 
    isReceivingCall: false, 
    from: '', 
    name: '', 
    signal: null, 
    pic: '' 
  });
  
  const [me, setMe] = useState('');
  const [name, setName] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // STUN সার্ভার কনফিগারেশন (WebRTC Connectivity Fix)
  const peerConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    // সকেট কানেক্ট হলে নিজের আইডি সেভ করা
    socket.on('me', (id) => {
      console.log("My Socket ID:", id);
      setMe(id);
    });

    // ইনকামিং কল লিসেনার
    socket.on('incomingCall', ({ from, name: callerName, signal, pic }) => {
      setCall({ 
        isReceivingCall: true, 
        from, 
        name: callerName, 
        signal, 
        pic 
      });
    });

    // কল এন্ডেড লিসেনার
    socket.on('callEnded', () => {
      leaveCall();
    });

    return () => {
      socket.off('me');
      socket.off('incomingCall');
      socket.off('callEnded');
    };
  }, []);

  // ২. মিডিয়া স্ট্রিম হ্যান্ডলার
  const getMediaStream = async () => {
    try {
      if (stream) return stream;

      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }, 
        audio: true 
      });
      
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      return currentStream;
    } catch (err) {
      console.error("Camera Access Error:", err);
      return null;
    }
  };

  // ✅ কল রিসিভ করা (Answer Call)
  const answerCall = async () => {
    const userStream = await getMediaStream();
    if (!userStream) return;

    setCallAccepted(true);
    setCallEnded(false);

    // simple-peer Constructor fix for Vite
    const PeerConstructor = Peer.default || Peer;
    const peer = new PeerConstructor({ 
      initiator: false, 
      trickle: false, 
      stream: userStream,
      config: peerConfig 
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    if (call.signal) {
      peer.signal(call.signal);
    }
    
    connectionRef.current = peer;
  };

  // 📞 কল করা (Initiate Call)
  const callUser = async (id, userName, userPic) => {
    const userStream = await getMediaStream();
    if (!userStream) return;

    const PeerConstructor = Peer.default || Peer;
    const peer = new PeerConstructor({ 
      initiator: true, 
      trickle: false, 
      stream: userStream,
      config: peerConfig 
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', { 
        userToCall: id, 
        signalData: data, 
        from: me, 
        name: userName || name,
        pic: userPic
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  // 🛑 কল শেষ করা
  const leaveCall = () => {
    setCallEnded(true);
    setCallAccepted(false);
    
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // স্টেট রিসেট
    setCall({ isReceivingCall: false, from: '', name: '', signal: null, pic: '' });
    setStream(null);
    
    // হার্ড রিলোড না করে ন্যাভিগেশন ব্যবহার করা ভালো, তবে WebRTC ক্লিনিংয়ের জন্য উইন্ডো রিলোড সেফ
    window.location.href = '/messages'; 
  };

  return (
    <SocketContext.Provider value={{ 
      call, 
      callAccepted, 
      callEnded,
      myVideo, 
      userVideo, 
      stream, 
      name, 
      setName, 
      answerCall, 
      leaveCall, 
      callUser, 
      me 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useCall = () => useContext(SocketContext);
export { ContextProvider, SocketContext };