import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// সকেট কানেকশন - autoConnect: false দিয়ে শুরু করা ভালো যাতে কম্পোনেন্ট মাউন্ট হওয়ার পর কানেক্ট হয়
const socket = io('https://onyx-drift-app-final-u29m.onrender.com', {
  transports: ['websocket'],
  secure: true
});

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState({ isReceivingCall: false, from: '', name: '', signal: null });
  const [me, setMe] = useState('');
  const [name, setName] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // ১. STUN সার্ভার কনফিগারেশন আপডেট (ICE Servers)
  const peerConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    socket.on('me', (id) => setMe(id));

    socket.on('incomingCall', ({ from, name: callerName, signal, pic }) => {
      // স্টেট আপডেট করার সময় আগের ডাটা ক্লিনিং
      setCall({ isReceivingCall: true, from, name: callerName, signal, pic });
    });

    return () => {
      socket.off('me');
      socket.off('incomingCall');
    };
  }, []);

  // ২. ক্যামেরা পারমিশন হ্যান্ডলার (Improved)
  const getMediaStream = async () => {
    try {
      // যদি আগে থেকেই স্ট্রিম থাকে তবে সেটি রিটার্ন করবে
      if (stream) return stream;

      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" // ফোনের ফ্রন্ট ক্যামেরা নিশ্চিত করতে
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
      alert("Please allow camera/microphone access to make calls.");
      return null;
    }
  };

  // ✅ কল রিসিভ করা (Answer Call) - Fixed Signal Handling
  const answerCall = async () => {
    const userStream = await getMediaStream();
    if (!userStream) return;

    setCallAccepted(true);

    const peer = new Peer({ 
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

    // সিগন্যাল ডাটা রিসিভ করা নিশ্চিত করা
    if (call.signal) {
      peer.signal(call.signal);
    }
    
    connectionRef.current = peer;
  };

  // 📞 কল করা (Initiate Call)
  const callUser = async (id) => {
    const userStream = await getMediaStream();
    if (!userStream) return;

    const peer = new Peer({ 
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
        name: name 
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      if (peer) {
        peer.signal(signal);
      }
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    window.location.reload(); // সেশন ক্লিন করতে রিলোড জরুরি
  };

  return (
    <SocketContext.Provider value={{ 
      call, callAccepted, myVideo, userVideo, stream, 
      name, setName, answerCall, leaveCall, callUser, me 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useCall = () => useContext(SocketContext);
export { ContextProvider, SocketContext };