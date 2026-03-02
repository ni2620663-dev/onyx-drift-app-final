import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaVideo, FaPhoneSlash, FaMicrophoneSlash, FaVideoSlash } from 'react-icons/fa';
import { useAuth0 } from "@auth0/auth0-react";
import { useCall } from '../context/CallContext';
import toast from 'react-hot-toast';

const CallPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth0();
    
    const { 
        call, 
        callAccepted, 
        callEnded, 
        myVideo, 
        userVideo, 
        stream, 
        answerCall, 
        callUser, 
        leaveCall 
    } = useCall(); 

    const queryParams = new URLSearchParams(location.search);
    const isAudioOnly = queryParams.get('mode') === 'audio';
    const remoteUserId = queryParams.get('to'); 

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(!isAudioOnly);
    
    const ringtoneRef = useRef(new Audio('/sounds/incoming-call.mp3'));

    useEffect(() => {
        // ১. ইনকামিং কল রিংটোন
        if (call?.isReceivingCall && !callAccepted) {
            ringtoneRef.current.loop = true;
            ringtoneRef.current.play().catch(() => console.log("Sound interaction blocked"));
        }

        // ২. কল ইনিশিয়ালাইজেশন (ফেসবুক স্টাইল লজিক)
        const initCall = async () => {
            try {
                if (remoteUserId) {
                    // আপনি কল দিচ্ছেন
                    await callUser(remoteUserId, user?.name, user?.picture, isAudioOnly);
                } else if (call?.isReceivingCall && !callAccepted) {
                    // আপনি কল রিসিভ করছেন
                    await answerCall();
                }
            } catch (err) {
                toast.error("Could not establish neural link");
            }
        };

        initCall();

        // ৩. ক্লিনআপ: মেমোরি লিক এবং WebMediaPlayer এরর ফিক্স
        return () => {
            ringtoneRef.current.pause();
            if (myVideo.current) myVideo.current.srcObject = null;
            if (userVideo.current) userVideo.current.srcObject = null;
        };
    }, [remoteUserId, call?.isReceivingCall, callAccepted]);

    // ৪. কল শেষ হলে নেভিগেট করা
    useEffect(() => {
        if (callEnded) {
            ringtoneRef.current.pause();
            const timer = setTimeout(() => navigate('/messages'), 1500);
            return () => clearTimeout(timer);
        }
    }, [callEnded, navigate]);

    // মাইক্রোফোন কন্ট্রোল
    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isMicOn;
                setIsMicOn(!isMicOn);
            }
        } else {
            toast.error("Microphone not ready");
        }
    };

    // ভিডিও কন্ট্রোল
    const toggleVideo = () => {
        if (stream && !isAudioOnly) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isCamOn;
                setIsCamOn(!isCamOn);
            }
        } else if (isAudioOnly) {
            toast.error("Video disabled in audio mode");
        }
    };

    return (
        <div className="fixed inset-0 bg-[#020617] overflow-hidden flex flex-col items-center justify-center font-sans z-[1000]">
            
            {/* 📸 Remote User View */}
            <AnimatePresence>
                {callAccepted && !callEnded ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="absolute inset-0 w-full h-full bg-black"
                    >
                        <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center gap-6 z-10 text-center">
                        <div className="relative">
                            <div className="w-40 h-40 rounded-full border-4 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                            <img 
                                src={call?.pic || "/images/default-avatar.png"} 
                                className="w-32 h-32 rounded-full absolute top-4 left-4 object-cover border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" 
                                alt="caller" 
                            />
                        </div>
                        <h2 className="text-white text-3xl font-black tracking-widest uppercase">
                            {call?.name || "Initializing..."}
                        </h2>
                        <div className="text-cyan-400 animate-pulse text-[12px] tracking-[0.5em] uppercase px-8 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/30">
                            {callEnded ? "Disconnected" : "Establishing Neural Link"}
                        </div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* 📹 Local Preview (Self Video) */}
            <motion.div 
                drag 
                dragConstraints={{ left: -300, right: 300, top: -400, bottom: 400 }} 
                className="absolute top-6 right-6 w-36 h-52 md:w-48 md:h-64 rounded-2xl border border-white/20 overflow-hidden z-50 bg-zinc-900 shadow-2xl cursor-grab active:cursor-grabbing"
            >
                <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full object-cover mirror ${!isCamOn ? 'hidden' : ''}`} />
                {!isCamOn && (
                   <div className="w-full h-full flex items-center justify-center bg-zinc-900/80 backdrop-blur-md">
                     <img src={user?.picture} className="w-16 h-16 rounded-full opacity-30 grayscale" alt="me" />
                   </div>
                )}
            </motion.div>

            {/* 🛠️ Modern Floating Controls */}
            <div className="absolute bottom-10 flex gap-8 items-center bg-[#0f172a]/80 backdrop-blur-xl px-10 py-6 rounded-[50px] border border-white/10 z-[60] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <button 
                    onClick={toggleMic} 
                    className={`p-5 rounded-2xl transition-all duration-300 ${!isMicOn ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-cyan-400 hover:bg-white/20'}`}
                >
                    {isMicOn ? <FaMicrophone size={22} /> : <FaMicrophoneSlash size={22} />}
                </button>
                
                <button 
                    onClick={leaveCall} 
                    className="p-7 rounded-full bg-red-600 text-white shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:scale-110 active:scale-90 transition-all duration-300"
                >
                    <FaPhoneSlash size={32} />
                </button>

                {!isAudioOnly && (
                    <button 
                        onClick={toggleVideo} 
                        className={`p-5 rounded-2xl transition-all duration-300 ${!isCamOn ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-cyan-400 hover:bg-white/20'}`}
                    >
                        {isCamOn ? <FaVideo size={22} /> : <FaVideoSlash size={22} />}
                    </button>
                )}
            </div>

            <style>{`.mirror { transform: scaleX(-1); }`}</style>
        </div>
    );
};

export default CallPage;