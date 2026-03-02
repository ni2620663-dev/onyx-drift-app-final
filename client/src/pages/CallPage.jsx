import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Peer from 'simple-peer'; 
import { io } from "socket.io-client";
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaVideo, FaPhoneSlash, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import { useAuth0 } from "@auth0/auth0-react";
import { useCall } from '../context/CallContext';
import toast from 'react-hot-toast';

// 🛠️ VITE GLOBAL FIX
if (typeof window !== 'undefined' && !window.global) {
    window.global = window;
}

const socket = io("https://onyx-drift-app-final-u29m.onrender.com", {
    transports: ["websocket"],
});

const CallPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth0();
    
    // ✅ Fix: Default empty object to prevent "undefined" error
    const { call = {} } = useCall(); 

    const queryParams = new URLSearchParams(location.search);
    const isAudioOnly = queryParams.get('mode') === 'audio';
    const remoteUserId = queryParams.get('to'); 

    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(!isAudioOnly);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    
    // ✅ Fix: Local Assets for Ringtone Stability
    const ringtoneRef = useRef(new Audio('/sounds/incoming-call.mp3'));

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ],
    };

    useEffect(() => {
        // রিংটোন হ্যান্ডলিং
        if (call?.isReceivingCall && !callAccepted) {
            ringtoneRef.current.loop = true;
            ringtoneRef.current.play().catch(() => console.log("Interaction required for audio"));
        }

        const setupMedia = async () => {
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({ 
                    video: !isAudioOnly ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false, 
                    audio: true 
                });
                
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;

                // ✅ Logic Fix: Use optional chaining to safely check call object
                if (remoteUserId) {
                    initiateCall(currentStream, remoteUserId);
                } else if (call?.isReceivingCall && call?.signal) {
                    respondToCall(currentStream, call.signal);
                }
            } catch (err) {
                console.error("Media Access Error:", err);
                toast.error("Camera/Mic access denied!");
            }
        };

        setupMedia();

        socket.on("callAccepted", (signal) => {
            setCallAccepted(true);
            ringtoneRef.current.pause();
            if (connectionRef.current) {
                connectionRef.current.signal(signal);
            }
        });

        socket.on("callEnded", () => {
            endCallLocally();
        });

        return () => {
            socket.off("callAccepted");
            socket.off("callEnded");
            ringtoneRef.current.pause();
            terminateTracks();
        };
    }, [call?.isReceivingCall]); // Dependency added for stability

    const initiateCall = (myStream, targetId) => {
        const PeerConstructor = Peer.default || Peer;
        const peer = new PeerConstructor({
            initiator: true,
            trickle: false,
            config: iceServers,
            stream: myStream,
        });

        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: targetId,
                signalData: data,
                from: socket.id,
                name: user?.name,
                pic: user?.picture,
                type: isAudioOnly ? 'audio' : 'video'
            });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });

        connectionRef.current = peer;
    };

    const respondToCall = (myStream, incomingSignal) => {
        setCallAccepted(true);
        ringtoneRef.current.pause();
        const PeerConstructor = Peer.default || Peer;
        const peer = new PeerConstructor({
            initiator: false,
            trickle: false,
            config: iceServers,
            stream: myStream,
        });

        peer.on('signal', (data) => {
            socket.emit('answerCall', { signal: data, to: call.from });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });

        peer.signal(incomingSignal);
        connectionRef.current = peer;
    };

    const terminateTracks = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const endCallLocally = () => {
        setCallEnded(true);
        ringtoneRef.current.pause();
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        terminateTracks();
        navigate('/messages');
        // window.location.reload(); // রিলোড না করে ন্যাভিগেট করাই বেটার
    };

    const handleEndCall = () => {
        const target = remoteUserId || call?.from;
        if (target) socket.emit("endCall", { to: target });
        endCallLocally();
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isMicOn;
                setIsMicOn(!isMicOn);
            }
        }
    };

    const toggleVideo = () => {
        if (stream && !isAudioOnly) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isCamOn;
                setIsCamOn(!isCamOn);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-[#020617] overflow-hidden flex flex-col items-center justify-center font-sans z-[1000]">
            
            {/* 📸 Remote Video Area */}
            <AnimatePresence>
                {callAccepted && !callEnded ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 w-full h-full bg-black">
                        <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center gap-6 z-10 text-center">
                        <div className="relative">
                            <div className="w-40 h-40 rounded-full border-4 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                            <img 
                                src={call?.pic || user?.picture || "/images/default-avatar.png"} 
                                className="w-32 h-32 rounded-full absolute top-4 left-4 object-cover border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" 
                                alt="avatar" 
                            />
                        </div>
                        <h2 className="text-white text-2xl font-black tracking-tight uppercase">
                            {call?.name || "Initializing Link..."}
                        </h2>
                        <div className="text-cyan-500 animate-pulse text-[10px] tracking-[0.4em] uppercase py-2 px-6 bg-cyan-500/5 rounded-full border border-cyan-500/20">
                            {callEnded ? "Connection Terminated" : "Neural Link Syncing..."}
                        </div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* 📹 Local Preview Floating Card */}
            <motion.div 
                drag 
                dragConstraints={{ left: -300, right: 300, top: -400, bottom: 400 }} 
                className="absolute top-6 right-6 w-32 h-44 md:w-44 md:h-60 rounded-3xl border border-white/10 overflow-hidden z-50 bg-zinc-900 shadow-2xl cursor-move"
            >
                <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full object-cover mirror ${!isCamOn ? 'hidden' : ''}`} />
                {!isCamOn && (
                   <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                     <img src={user?.picture} className="w-12 h-12 rounded-full opacity-20 grayscale" alt="avatar" />
                   </div>
                )}
            </motion.div>

            {/* 🛠️ Modern Call Controls */}
            <div className="absolute bottom-10 flex gap-6 items-center bg-zinc-900/90 backdrop-blur-2xl px-8 py-5 rounded-[40px] border border-white/5 z-[60] shadow-2xl">
                <button 
                    onClick={toggleMic} 
                    className={`p-4 rounded-2xl transition-all ${!isMicOn ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}
                >
                    {isMicOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
                </button>
                
                <button 
                    onClick={handleEndCall} 
                    className="p-6 rounded-full bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-95 transition-all"
                >
                    <FaPhoneSlash size={28} />
                </button>

                {!isAudioOnly && (
                    <button 
                        onClick={toggleVideo} 
                        className={`p-4 rounded-2xl transition-all ${!isCamOn ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-cyan-400 hover:bg-white/10'}`}
                    >
                        {isCamOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
                    </button>
                )}
            </div>

            <style>{`.mirror { transform: scaleX(-1); }`}</style>
        </div>
    );
};

export default CallPage;