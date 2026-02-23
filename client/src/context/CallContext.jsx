import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// সকেট কানেকশন কনফিগারেশন
const socket = io('https://onyx-drift-app-final-u29m.onrender.com', {
  transports: ['websocket'],
});

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');
  const [name, setName] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // 🌐 STUN Servers যোগ করা হয়েছে যাতে গ্লোবাল নেটওয়ার্কে (যেমন ফোন-টু-পিসি) কল কানেক্ট হয়
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    socket.on('me', (id) => setMe(id));

    socket.on('incomingCall', ({ from, name: callerName, signal, pic }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal, pic });
    });

    return () => {
      socket.off('me');
      socket.off('incomingCall');
    };
  }, []);

  const getMediaStream = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      return currentStream;
    } catch (err) {
      console.error("Media Access Denied:", err);
      return null;
    }
  };

  // ✅ কল রিসিভ করা (Answer Call)
  const answerCall = async () => {
    setCallAccepted(true);
    
    const userStream = await getMediaStream();
    if (!userStream) return;

    const peer = new Peer({ 
      initiator: false, 
      trickle: false, 
      stream: userStream,
      config: iceServers // STUN সার্ভার কনফিগারেশন যোগ করা হয়েছে
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(call.signal);
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
      config: iceServers // STUN সার্ভার কনফিগারেশন যোগ করা হয়েছে
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
      peer.signal(signal);
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

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{ 
      call, 
      callAccepted, 
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

export const useCall = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useCall must be used within a ContextProvider');
  }
  return context;
};

export { ContextProvider, SocketContext };