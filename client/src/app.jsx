import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiXMark } from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";

// Components & Pages
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

// --- 📞 CALL CONTEXT ---
import { useCall } from './context/CallContext';

// --- 🔊 RINGTONE CONFIG ---
const INCOMING_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3";

const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono italic uppercase tracking-widest animate-pulse">
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
  
  const { 
    call, 
    callAccepted, 
    answerCall, 
    leaveCall
  } = useCall();

  const incomingAudio = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);

  // ব্রাউজার ইন্টারঅ্যাকশন ট্র্যাকিং (Autoplay & Vibration Fix)
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    
    // অডিও ইনিশিয়ালাইজেশন
    const audio = new Audio(INCOMING_SOUND_URL);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    incomingAudio.current = audio;

    return () => {
      if (incomingAudio.current) {
        incomingAudio.current.pause();
        incomingAudio.current = null;
      }
    };
  }, []);

  const API_AUDIENCE = "https://onyx-drift-api.com";
  const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  /* =================📡 USER DATA SYNC ================= */
  useEffect(() => {
    const syncUserWithDB = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { 
              audience: API_AUDIENCE,
              scope: "openid profile email offline_access" 
            },
          });

          const userData = {
            auth0Id: user.sub,
            name: user.name,
            email: user.email,
            picture: user.picture,
            nickname: user.nickname || user.name?.split(' ')[0].toLowerCase(),
          };

          await axios.post(`${BACKEND_URL}/api/users/sync`, userData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.error("❌ Neural Sync Error:", err.message);
        }
      }
    };
    syncUserWithDB();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  /* =================📡 RINGTONE & VIBRATION ================= */
  useEffect(() => {
    if (call.isReceivingCall && !callAccepted) {
      // ইউজার ইন্টারঅ্যাক্ট করলে অডিও এবং ভাইব্রেশন কাজ করবে
      if (userInteracted && incomingAudio.current) {
        incomingAudio.current.play().catch(e => console.log("Audio play deferred", e));
        
        if (navigator.vibrate) {
          try {
            navigator.vibrate([500, 200, 500, 200, 500]);
          } catch (e) {
            console.warn("Vibration failed", e);
          }
        }
      }
    } else {
      if (incomingAudio.current) {
        incomingAudio.current.pause();
        incomingAudio.current.currentTime = 0;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    }
  }, [call.isReceivingCall, callAccepted, userInteracted]);

  const handleAnswerCall = () => {
    if (incomingAudio.current) incomingAudio.current.pause();
    answerCall();
    navigate(`/call/${call.roomId || 'active-session'}?mode=${call.type || 'video'}`); 
  };

  const handleRejectCall = () => {
    if (incomingAudio.current) incomingAudio.current.pause();
    leaveCall();
  };

  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
  const isReelsPage = location.pathname.startsWith("/reels");

  if (isLoading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono tracking-widest animate-pulse">
      ONYX_DRIFT_OS: CONNECTING...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative overflow-x-hidden">
      <Toaster position="top-center" />
      <CustomCursor />

      {/* =================📞 INCOMING CALL UI ================= */}
      <AnimatePresence>
        {call.isReceivingCall && !callAccepted && (
          <motion.div 
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -150, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] w-[95%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] bg-black/90 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" />
                  <img 
                    src={call.pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.name}`} 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover" 
                    alt="caller" 
                  />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-[14px] font-black text-white uppercase tracking-tighter truncate w-32 md:w-40">{call.name || "Unknown Link"}</h4>
                  <p className="text-[10px] text-cyan-500 font-black tracking-widest uppercase animate-pulse">Incoming {call.type === 'audio' ? 'Audio' : 'Video'} Link...</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRejectCall} className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 border border-red-500/40 flex items-center justify-center active:scale-90 transition-all shadow-lg hover:bg-red-500 hover:text-white"><HiXMark size={26} /></button>
                <button onClick={handleAnswerCall} className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-cyan-500/30 hover:bg-cyan-400"><FaPhone size={18} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full">
        <div className="flex justify-center w-full">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            {isAuthenticated && !isFullWidthPage && !isReelsPage && (
              <aside className="hidden lg:block w-[280px] sticky top-0 h-screen py-6">
                <Sidebar />
              </aside>
            )}
            <main className={`flex-1 flex justify-center mt-0 ${isFullWidthPage ? "" : "pb-24 lg:pb-10 pt-6"}`}>
              <div className={`${isFullWidthPage ? "w-full" : "w-full lg:max-w-[650px]"}`}>
                <Suspense fallback={<div className="h-screen bg-[#020617]" />}>
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
              </div>
            </main>
          </div>
        </div>
      </div>

      {isAuthenticated && !isReelsPage && !location.pathname.startsWith("/call") && (
        <MobileNav userAuth0Id={user?.sub} />
      )}
    </div>
  );
}