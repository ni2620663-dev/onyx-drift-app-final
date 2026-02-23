import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// সকেট কানেকশন
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

  useEffect(() => {
    // অ্যাপ ওপেন হলে শুধু সকেট আইডি এবং ইনকামিং কল লিসেন করবে
    socket.on('me', (id) => setMe(id));

    socket.on('incomingCall', ({ from, name: callerName, signal, pic }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal, pic });
    });

    return () => {
      socket.off('me');
      socket.off('incomingCall');
    };
  }, []);

  // 📹 ক্যামেরা এবং মাইক্রোফোন চালু করার ফাংশন (শুধুমাত্র কলের সময় চলবে)
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
    
    const userStream = await getMediaStream(); // এখানে ক্যামেরা অন হবে
    if (!userStream) return;

    const peer = new Peer({ initiator: false, trickle: false, stream: userStream });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  // 📞 কল করা (Initiate Call)
  const callUser = async (id) => {
    const userStream = await getMediaStream(); // এখানে ক্যামেরা অন হবে
    if (!userStream) return;

    const peer = new Peer({ initiator: true, trickle: false, stream: userStream });

    peer.on('signal', (data) => {
      socket.emit('callUser', { 
        userToCall: id, 
        signalData: data, 
        from: me, 
        name: name 
      });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  // ❌ কল শেষ করা (Leave Call)
  const leaveCall = () => {
    setCallEnded(true);

    if (connectionRef.current) {
      connectionRef.current.destroy();
    }

    // ক্যামেরা এবং অডিও ট্রাকগুলো বন্ধ করা যাতে ল্যাপটপের আলো নিভে যায়
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // পেজ রিলোড না করে স্টেট রিসেট করা ভালো, তবে আপনার রিলোড প্রয়োজন হলে রাখতে পারেন
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

// কাস্টম হুক
export const useCall = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useCall must be used within a ContextProvider');
  }
  return context;
};

export { ContextProvider, SocketContext };