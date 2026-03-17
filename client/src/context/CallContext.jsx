import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { Buffer } from 'buffer'; // Buffer ইম্পোর্ট করা জরুরি

// ১. Vite & WebRTC Polyfills
if (typeof window !== 'undefined') {
    window.global = window;
    window.Buffer = Buffer; // SimplePeer এর জন্য Buffer সেট করা
    window.process = { env: {} }; 
}

const SocketContext = createContext();

// সকেট কানেকশন (ইউআরএল চেক করে নিন)
const socket = io('https://onyx-drift-app-final-u29m.onrender.com', {
    transports: ['websocket'],
    secure: true,
    reconnection: true
});

const ContextProvider = ({ children }) => {
    const [call, setCall] = useState({ isReceivingCall: false, from: '', name: '', signal: null, pic: '', type: 'video' });
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        // সকেট আইডি পাওয়া
        socket.on('me', (id) => setMe(id));

        // ইনকামিং কল রিসিভ করা
        socket.on('incomingCall', ({ from, name, signal, pic, type }) => {
            setCall({ isReceivingCall: true, from, name, signal, pic, type });
        });

        // কল শেষ হওয়ার ইভেন্ট
        socket.on('callEnded', () => {
            handleEndCallUI();
        });

        return () => {
            socket.off('me');
            socket.off('incomingCall');
            socket.off('callEnded');
        };
    }, []);

    // মিডিয়া পারমিশন (ক্যামেরা/মাইক)
    const getMedia = async (isAudioOnly = false) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: !isAudioOnly,
                audio: true
            });
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (err) {
            console.error("Media Access Error:", err);
            alert("Please allow camera/mic access.");
            return null;
        }
    };

    // কল রিসিভ করা
    const answerCall = async () => {
        setCallAccepted(true);
        const userStream = await getMedia(call.type === 'audio');
        if (!userStream) return;

        const peer = new SimplePeer({ 
            initiator: false, 
            trickle: false, 
            stream: userStream 
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

    // কাউকে কল করা
    const callUser = async (id, name, pic, isAudioOnly = false) => {
        const userStream = await getMedia(isAudioOnly);
        if (!userStream) return;

        const peer = new SimplePeer({ 
            initiator: true, 
            trickle: false, 
            stream: userStream 
        });

        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: id,
                signalData: data,
                from: me,
                name: name, // আপনার রিকোয়েস্ট অনুযায়ী নাম পাঠানো হচ্ছে
                pic: pic,
                type: isAudioOnly ? 'audio' : 'video'
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

    // কল কেটে দেওয়া
    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        
        // সকেটকে জানানো যে কল শেষ
        const target = call.from || me;
        socket.emit("endCall", { to: target });

        handleEndCallUI();
    };

    // স্টেটস রিসেট করার ফাংশন (লুপ প্রোটেকটেড)
    const handleEndCallUI = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        setCall({ isReceivingCall: false, from: '', name: '', signal: null, pic: '', type: 'video' });
        setCallAccepted(false);
        setCallEnded(true);
        setStream(null);

        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;

        // নোট: এখানে window.location.href ব্যবহার করবেন না। 
        // এর বদলে UI-তে 'Call Ended' মেসেজ দেখান।
    };

    return (
        <SocketContext.Provider value={{
            call, callAccepted, callEnded, myVideo, userVideo, stream,
            me, answerCall, callUser, leaveCall, setCallEnded
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useCall = () => useContext(SocketContext);
export { ContextProvider, SocketContext };
