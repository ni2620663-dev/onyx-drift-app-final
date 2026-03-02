import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiXMark } from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";

import Sidebar from "./components/Sidebar";
import Messenger from "./pages/Messenger";
import PremiumHomeFeed from "./pages/PremiumHomeFeed";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings"; 
import ReelsFeed from "./pages/ReelsFeed";
import Landing from "./pages/Landing"; 
import JoinPage from "./pages/JoinPage";
import CallPage from "./pages/CallPage";
import CustomCursor from "./components/CustomCursor";
import MobileNav from "./components/MobileNav";
import AITwinSync from './components/AITwinSync';

import { useCall } from './context/CallContext';

const RING_SOUND_PATH = "/sounds/incoming-call.mp3"; 
const DEFAULT_AVATAR = "/images/default-avatar.png"; 
const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const API_AUDIENCE = "https://onyx-drift-api.com";

const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono animate-pulse uppercase tracking-widest">
        Initializing Neural Link...
      </div>
    ),
  });
  return <AuthenticatedComponent {...props} />;
};

export default function App() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const { call, callAccepted, answerCall, leaveCall } = useCall();

  const incomingAudio = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // ১. ইউজার ইন্টারঅ্যাকশন হ্যান্ডলার (ব্রাউজার পলিসি অনুযায়ী অডিও আনলক করা)
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      if (incomingAudio.current) {
        incomingAudio.current.load();
      }
      ["click", "touchstart", "keydown"].forEach(e => 
        window.removeEventListener(e, handleFirstInteraction)
      );
    };

    ["click", "touchstart", "keydown"].forEach(e => 
      window.addEventListener(e, handleFirstInteraction)
    );

    incomingAudio.current = new Audio(RING_SOUND_PATH);
    incomingAudio.current.loop = true;

    return () => {
      ["click", "touchstart", "keydown"].forEach(e => 
        window.removeEventListener(e, handleFirstInteraction)
      );
    };
  }, []);

  // ২. রিংটোন এবং ভাইব্রেশন কন্ট্রোল
  useEffect(() => {
    let vibrationInterval;
    
    if (call?.isReceivingCall && !callAccepted) {
      if (userInteracted) {
        incomingAudio.current?.play().catch(() => console.log("Audio play blocked"));
        
        // ভাইব্রেশন লজিক
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500]);
          vibrationInterval = setInterval(() => navigator.vibrate([500, 200, 500]), 2000);
        }
      }
    } else {
      // স্টপ রিংটোন এবং ভাইব্রেশন
      incomingAudio.current?.pause();
      if (incomingAudio.current) incomingAudio.current.currentTime = 0;
      if (navigator.vibrate) navigator.vibrate(0);
      if (vibrationInterval) clearInterval(vibrationInterval);
    }

    return () => {
      if (vibrationInterval) clearInterval(vibrationInterval);
      if (navigator.vibrate) navigator.vibrate(0);
    };
  }, [call?.isReceivingCall, callAccepted, userInteracted]);

  // ৩. ডাটাবেস সিঙ্ক
  useEffect(() => {
    const syncUserWithDB = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: API_AUDIENCE, scope: "openid profile email" },
          });
          await axios.post(`${BACKEND_URL}/api/users/sync`, {
            auth0Id: user.sub,
            name: user.name,
            email: user.email,
            picture: user.picture,
            nickname: user.nickname || user.name?.split(' ')[0].toLowerCase(),
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) { console.error("Database sync failed"); }
      }
    };
    syncUserWithDB();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  // ৪. কল হ্যান্ডলার
  const handleAnswer = async () => {
    // পপ-আপ থেকে সরাসরি কল পেজে নিয়ে যাওয়া
    const targetRoom = call.from || 'session';
    navigate(`/call/${targetRoom}`);
  };

  // ৫. পেজ কন্ডিশনস
  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => 
    location.pathname === path || location.pathname.startsWith(path + "/")
  );
  
  const isCallPage = location.pathname.startsWith("/call");

  if (isLoading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono animate-pulse">ONYX_DRIFT_OS: CONNECTING...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />

      {/* 📞 Facebook Style Incoming Call Overlay */}
      <AnimatePresence>
        {call?.isReceivingCall && !callAccepted && !isCallPage && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} 
            animate={{ y: 20, opacity: 1 }} 
            exit={{ y: -100, opacity: 0 }} 
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000000] w-[95%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] bg-black/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" />
                  <img 
                    src={call.pic || DEFAULT_AVATAR} 
                    className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover relative z-10" 
                    alt="caller"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase truncate max-w-[150px]">{call.name || "Unknown"}</h4>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-widest animate-pulse uppercase">Neural Link Request...</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={leaveCall} 
                  className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                  <HiXMark size={24} />
                </button>
                <button 
                  onClick={handleAnswer} 
                  className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <FaPhone size={20} className="animate-bounce" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full">
        <div className="flex justify-center w-full">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            {isAuthenticated && !isFullWidthPage && (
              <aside className="hidden lg:block w-[280px] sticky top-0 h-screen py-6">
                <Sidebar />
              </aside>
            )}
            <main className={`flex-1 ${isFullWidthPage ? "" : "pb-24 lg:pb-10 pt-6"}`}>
              <Suspense fallback={<div className="h-screen flex items-center justify-center text-cyan-500 font-mono">Neural Loading...</div>}>
                <Routes>
                  <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
                  <Route path="/join" element={<JoinPage />} /> 
                  <Route path="/feed" element={<ProtectedRoute component={PremiumHomeFeed} />} />
                  <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
                  <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                  <Route path="/messages/:userId?" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/messenger/:userId?" element={<ProtectedRoute component={Messenger} />} />
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

      {isAuthenticated && location.pathname !== "/reels" && !isCallPage && (
        <MobileNav userAuth0Id={user?.sub} />
      )}
    </div>
  );
}