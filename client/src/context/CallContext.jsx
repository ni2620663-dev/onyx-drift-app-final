import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();
const socket = io('https://onyx-drift-app-final-u29m.onrender.com');

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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => console.error("Media Access Denied:", err));

    socket.on('me', (id) => setMe(id));

    socket.on('incomingCall', ({ from, name: callerName, signal, pic }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal, pic });
    });

    return () => {
      socket.off('me');
      socket.off('incomingCall');
    };
  }, []);

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });

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

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

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

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
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
      callUser 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// এই অংশটি যোগ করা হয়েছে যা আপনার এরর ফিক্স করবে
export const useCall = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useCall must be used within a ContextProvider');
  }
  return context;
};

export { ContextProvider, SocketContext };