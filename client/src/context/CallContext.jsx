import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
// পরিবর্তন করুন এভাবে:
import SimplePeer from 'simple-peer';

// ১. Vite & WebRTC Polyfills
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = { env: {} }; // Simple-peer internal dependencies এর জন্য
}

const SocketContext = createContext();

// সকেট ইউআরএল (আপনার প্রোভাইড করা ইউআরএল)
const socket = io('https://onyx-drift-app-final-u29m.onrender.com', {
    transports: ['websocket'],
    secure: true
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
        // নিজের সকেট আইডি সেট করা
        socket.on('me', (id) => setMe(id));

        // ইনকামিং কল লিসেনার
        socket.on('incomingCall', ({ from, name, signal, pic, type }) => {
            setCall({ isReceivingCall: true, from, name, signal, pic, type });
        });

        // কল এন্ডেড লিসেনার
        socket.on('callEnded', () => {
            resetCallState();
        });

        return () => {
            socket.off('me');
            socket.off('incomingCall');
            socket.off('callEnded');
        };
    }, []);

    // ২. মিডিয়া স্ট্রিম হ্যান্ডলিং (ক্যামেরা/মাইক্রোফোন)
    const getMedia = async (isAudioOnly = false) => {
        try {
            // আগের কোনো স্ট্রিম থাকলে সেটা বন্ধ করা (WebMediaPlayer এরর ফিক্স করতে)
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

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
            return null;
        }
    };

    // ৩. কল রিসিভ করা (Answer Call)
    const answerCall = async () => {
        setCallAccepted(true);
        const userStream = await getMedia(call.type === 'audio');
        if (!userStream) return;

        const peer = new Peer({ 
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

    // ৪. কল করা (Initiate Call)
    const callUser = async (id, name, pic, isAudioOnly = false) => {
        const userStream = await getMedia(isAudioOnly);
        if (!userStream) return;

        const peer = new Peer({ 
            initiator: true, 
            trickle: false, 
            stream: userStream 
        });

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

    // ৫. কল এন্ড করা
    const leaveCall = () => {
        setCallEnded(true);
        
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }

        // সকেটকে জানানো যে কল শেষ
        const target = call.from || me;
        socket.emit("endCall", { to: target });

        resetCallState();
    };

    // স্টেট রিসেট ফাংশন (ফেসবুক স্টাইল - পেজ রিলোড ছাড়াই)
    const resetCallState = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        setCall({ isReceivingCall: false, from: '', name: '', signal: null, pic: '', type: 'video' });
        setCallAccepted(false);
        setCallEnded(false);
        setStream(null);
        
        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;

        // কল শেষ হলে মেসেজ পেজে নিয়ে যাওয়া
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