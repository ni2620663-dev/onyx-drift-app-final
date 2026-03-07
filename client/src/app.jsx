import React, { useEffect, useRef, useState, Suspense, lazy, useCallback } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiXMark } from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";
import { Mic, MicOff } from 'lucide-react';

// Neural Core Imports
import OnyxEngine from "./core/OnyxEngine"; 
import { SecurityShield } from "./core/SecurityShield";
import MasterAI from "./core/MasterAI";
// Components
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import MobileNav from "./components/MobileNav";

// Pages (Lazy Loading)
const Messenger = lazy(() => import("./pages/Messenger"));
const PremiumHomeFeed = lazy(() => import("./pages/PremiumHomeFeed"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings")); 
const ReelsFeed = lazy(() => import("./pages/ReelsFeed"));
const Landing = lazy(() => import("./pages/Landing")); 
const JoinPage = lazy(() => import("./pages/JoinPage"));
const CallPage = lazy(() => import("./pages/CallPage"));
const AITwinSync = lazy(() => import("./components/AITwinSync"));

import { useCall } from './context/CallContext';

const RING_SOUND_PATH = "/sounds/incoming-call.mp3"; 
const DEFAULT_AVATAR = "/images/default-avatar.png"; 
const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const API_AUDIENCE = "https://onyx-drift-api.com";

/* ==========================================================
    🎤 Global Voice Intelligence Engine (Ultra Mode)
========================================================== */
const GlobalVoiceAssistant = ({ user }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef(null);
  const { leaveCall } = useCall();

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = useCallback((command) => {
    const cmd = command.toLowerCase();
    setLastTranscript(command);
    console.log("OS_COMMAND_RECEIVED:", cmd);

    if (cmd.includes("open home")) navigate("/feed");
    if (cmd.includes("open messages") || cmd.includes("chat")) navigate("/messages");
    if (cmd.includes("go to profile")) navigate(`/profile/${user?.sub}`);
    if (cmd.includes("open reels")) navigate("/reels");
    if (cmd.includes("open settings")) navigate("/settings");
    if (cmd.includes("open chat with")) {
      const name = cmd.split("with")[1];
      speak(`Searching for ${name} in your neural link`);
      navigate(`/messages?q=${name.trim()}`);
    }
    if (cmd.includes("create new post") || cmd.includes("upload")) {
      document.getElementById("voice-upload-btn")?.click();
      speak("Opening uplink terminal");
    }
    if (cmd.includes("like this")) {
      const likeBtn = document.querySelector('[aria-label="like"]') || document.getElementById("voice-like-btn");
      likeBtn?.click();
      toast.success("Interaction Recorded!");
    }
    if (cmd.includes("search for")) {
      const query = cmd.split("for")[1];
      speak(`Finding results for ${query}`);
      navigate(`/search?q=${query.trim()}`);
    }
    if (cmd.includes("answer call") || cmd.includes("pick up")) {
       document.getElementById("answer-call-btn")?.click();
    }
    if (cmd.includes("end call") || cmd.includes("cut")) leaveCall();
    if (cmd.includes("next video") || cmd.includes("scroll down")) {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
    if (cmd.includes("back video") || cmd.includes("scroll up")) {
      window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
    }
    if (cmd.includes("pause")) document.querySelectorAll('video').forEach(v => v.pause());
    if (cmd.includes("play")) document.querySelectorAll('video').forEach(v => v.play());
    if (cmd.includes("dark mode")) document.documentElement.classList.add('dark');
    if (cmd.includes("light mode")) document.documentElement.classList.remove('dark');
    if (cmd.includes("show my notifications")) speak("You have 3 new notifications in your data stream.");
    if (cmd.includes("how many followers")) speak(`Analyzing network. You have 1,240 authorized drifters following you.`);
    if (cmd.includes("who am i")) speak(`System identification: You are ${user?.name}. Operator of this terminal.`);
  }, [navigate, user, leaveCall]);
  useEffect(() => {
  window.MasterAI = MasterAI; 
  console.log("OnyxDrift: Master AI Engine Initialized.");
}, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      handleVoiceCommand(transcript);
    };
    if (isListening) recognitionRef.current.start();
    else recognitionRef.current.stop();
    return () => recognitionRef.current.stop();
  }, [isListening, handleVoiceCommand]);

  return (
    <div className="fixed bottom-24 right-6 z-[99999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isListening && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-black/90 backdrop-blur-xl border border-cyan-500/40 p-3 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">OS_LISTENING</p>
            </div>
            <p className="text-white text-[11px] mt-1 italic opacity-80">"{lastTranscript || "Awaiting signal..."}"</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsListening(!isListening)} className={`w-14 h-14 rounded-full border shadow-2xl transition-all flex items-center justify-center ${isListening ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse shadow-[0_0_20px_#00f2ff]' : 'bg-zinc-900/80 text-cyan-500 border-white/10 backdrop-blur-md'}`}>
        {isListening ? <Mic size={24} strokeWidth={2.5} /> : <MicOff size={24} />}
      </motion.button>
    </div>
  );
};

const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono animate-pulse uppercase tracking-widest text-xs">Initializing Neural Link...</div>,
  });
  return <AuthenticatedComponent {...props} />;
};

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const { call, callAccepted, leaveCall } = useCall();
  
  const videoRef = useRef(null);
  const incomingAudio = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    let animationFrameId;
    if (isAuthenticated) {
      const initNeuralSystem = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
          await OnyxEngine.init();
          
          const loop = async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && OnyxEngine.detector) {
              const faces = await OnyxEngine.detector.estimateFaces(videoRef.current);
              
              // ফেস ডিটেকশন ডেটা থাকলে তবেই সিকিউরিটি চেক করুন
              if (faces.length > 0) {
                if (SecurityShield.detectIntrusion(faces) !== "SAFE") {
                    SecurityShield.triggerLock();
                }
              }
              OnyxEngine.process(videoRef.current);
            }
            animationFrameId = requestAnimationFrame(loop);
          };
          loop();
        } catch (err) { console.error("Neural Link Init Failed"); }
      };
      initNeuralSystem();
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        if (incomingAudio.current) incomingAudio.current.load();
        ["click", "touchstart", "keydown", "mousedown"].forEach(e => window.removeEventListener(e, handleFirstInteraction));
      }
    };
    ["click", "touchstart", "keydown", "mousedown"].forEach(e => window.addEventListener(e, handleFirstInteraction));
    incomingAudio.current = new Audio(RING_SOUND_PATH);
    incomingAudio.current.loop = true;
    return () => { ["click", "touchstart", "keydown", "mousedown"].forEach(e => window.removeEventListener(e, handleFirstInteraction)); };
  }, [userInteracted]);

  const handleAnswer = () => {
    const targetRoom = call.from || 'session';
    incomingAudio.current?.pause();
    navigate(`/call/${targetRoom}`);
  };

  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
  const isCallPage = location.pathname.startsWith("/call");

  if (isLoading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono animate-pulse uppercase text-xs">Onyx_Drift_OS: Connecting...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />
      <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted />
      {isAuthenticated && <GlobalVoiceAssistant user={user} />}

      <AnimatePresence>
        {call?.isReceivingCall && !callAccepted && !isCallPage && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000000] w-[95%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] bg-black/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative"><div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" /><img src={call.pic || DEFAULT_AVATAR} className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover relative z-10" alt="caller" /></div>
                <div><h4 className="text-sm font-black text-white uppercase truncate max-w-[150px]">{call.name || "Unknown"}</h4><p className="text-[10px] text-cyan-400 font-bold tracking-widest animate-pulse uppercase">Neural Link Request...</p></div>
              </div>
              <div className="flex gap-3"><button onClick={leaveCall} className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><HiXMark size={24} /></button><button id="answer-call-btn" onClick={handleAnswer} className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]"><FaPhone size={20} className="animate-bounce" /></button></div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full">
        <div className="flex justify-center w-full">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            {isAuthenticated && !isFullWidthPage && <aside className="hidden lg:block w-[280px] sticky top-0 h-screen py-6"><Sidebar /></aside>}
            <main className={`flex-1 ${isFullWidthPage ? "" : "pb-24 lg:pb-10 pt-6"}`}>
              <Suspense fallback={<div className="h-screen flex flex-col items-center justify-center bg-[#020617]"><div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-cyan-500 font-mono text-xs uppercase tracking-[0.3em]">Neural Loading...</p></div>}>
                <Routes>
                  <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
                  <Route path="/join" element={<JoinPage />} /> 
                  <Route path="/feed" element={<ProtectedRoute component={PremiumHomeFeed} />} />
                  <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
                <Route path="/profile/:userId" element={<ProtectedRoute component={ProfilePage} />} />
                  <Route path="/messages/:userId?" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                  <Route path="/call/:roomId" element={<ProtectedRoute component={CallPage} />} />
                  <Route path="/ai-twin" element={<ProtectedRoute component={AITwinSync} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </div>
      {isAuthenticated && location.pathname !== "/reels" && !isCallPage && <MobileNav userAuth0Id={user?.sub} />}
    </div>
  );
}