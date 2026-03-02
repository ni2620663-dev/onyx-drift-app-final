import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

// Vite Fix for simple-peer
if (typeof window !== 'undefined' && !window.global) {
    window.global = window;
}

const SocketContext = createContext();

const socket = io('https://onyx-drift-app-final-u29m.onrender.com', {
    transports: ['websocket'],
    secure: true
});

const ContextProvider = ({ children }) => {
    const [call, setCall] = useState({ isReceivingCall: false, from: '', name: '', signal: null, pic: '' });
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        socket.on('me', (id) => setMe(id));

        socket.on('incomingCall', ({ from, name, signal, pic }) => {
            // ফেসবুক স্টাইলে সরাসরি স্টেট আপডেট
            setCall({ isReceivingCall: true, from, name, signal, pic });
        });

        socket.on('callEnded', () => {
            leaveCall();
        });

        return () => {
            socket.off('me');
            socket.off('incomingCall');
            socket.off('callEnded');
        };
    }, []);

    // ১. ক্যামেরা ও মাইক্রোফোন এক্সেস (ফেসবুকের মতো কল রিসিভ করার পর অন হবে)
    const getMedia = async (isAudioOnly = false) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: !isAudioOnly,
                audio: true
            });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;
            return currentStream;
        } catch (err) {
            console.error("Media Error:", err);
            return null;
        }
    };

    // ২. কল রিসিভ করা (Answer Call)
    const answerCall = async () => {
        setCallAccepted(true);
        const userStream = await getMedia(call.type === 'audio');
        
        const peer = new Peer({ initiator: false, trickle: false, stream: userStream });

        peer.on('signal', (data) => {
            socket.emit('answerCall', { signal: data, to: call.from });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });

        peer.signal(call.signal);
        connectionRef.current = peer;
    };

    // ৩. কল করা (Call User)
    const callUser = async (id, name, pic, isAudioOnly = false) => {
        const userStream = await getMedia(isAudioOnly);
        
        const peer = new Peer({ initiator: true, trickle: false, stream: userStream });

        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: id,
                signalData: data,
                from: me,
                name: name,
                pic: pic,
                type: isAudioOnly ? 'audio' : 'video'
            });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });

        socket.on('callAccepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) connectionRef.current.destroy();
        if (stream) stream.getTracks().forEach(track => track.stop());
        
        // রিলোড না করে জাস্ট স্টেট রিসেট (ফেসবুক স্টাইল)
        setCall({ isReceivingCall: false, from: '', name: '', signal: null });
        setCallAccepted(false);
        window.location.href = '/messages';
    };

    return (
        <SocketContext.Provider value={{
            call, callAccepted, callEnded, myVideo, userVideo, stream,
            me, answerCall, callUser, leaveCall
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useCall = () => useContext(SocketContext);
export { ContextProvider, SocketContext };