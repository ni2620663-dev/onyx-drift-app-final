import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiXMark, HiLink, HiCalendarDays } from "react-icons/hi2";
import { FaPhone, FaUsers, FaVideo } from "react-icons/fa";

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

  // --- 🔗 ১. ইনস্ট্যান্ট গ্রুপ মিটিং লিঙ্ক জেনারেটর ---
  const handleInstantMeeting = () => {
    const roomId = `room-${Math.random().toString(36).substring(2, 10)}`;
    const groupLink = `${window.location.origin}/call/${roomId}?mode=group`;
    
    navigator.clipboard.writeText(groupLink);
    toast.success("Group Link Copied! Share it to start meeting.", {
      style: { background: '#020617', color: '#06b6d4', border: '1px solid #06b6d4' },
      icon: <FaUsers className="text-cyan-400" />
    });
    navigate(`/call/${roomId}?mode=group`);
  };

  // --- 📅 ২. শিডিউলড মিটিং (ক্যালেন্ডার নোটিফিকেশন) ---
  const handleScheduleMeeting = () => {
    toast("Syncing with Neural Calendar...", { 
      icon: <HiCalendarDays className="text-cyan-400" />,
      style: { background: '#020617', color: '#fff' }
    });
  };

  // ব্রাউজার ইন্টারঅ্যাকশন ট্র্যাকিং
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      if (incomingAudio.current) incomingAudio.current.load();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    
    const audio = new Audio(INCOMING_SOUND_URL);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    incomingAudio.current = audio;

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
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
    let vibrationInterval;
    if (call.isReceivingCall && !callAccepted) {
      if (userInteracted && incomingAudio.current) {
        incomingAudio.current.play().catch(() => {});
      }
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500]);
        vibrationInterval = setInterval(() => navigator.vibrate([500, 200, 500]), 2000);
      }
    } else {
      if (incomingAudio.current) {
        incomingAudio.current.pause();
        incomingAudio.current.currentTime = 0;
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
        clearInterval(vibrationInterval);
      }
    }
    return () => clearInterval(vibrationInterval);
  }, [call.isReceivingCall, callAccepted, userInteracted]);

  const handleAnswerCall = () => {
    if (incomingAudio.current) incomingAudio.current.pause();
    answerCall();
    navigate(`/call/${call.roomId || 'active-session'}?mode=${call.type || 'video'}`); 
  };

  const handleRejectCall = () => {
    if (incomingAudio.current) incomingAudio.current.pause();
    leaveCall();
    toast.error("Call Declined");
  };

  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => 
    location.pathname === path || location.pathname.startsWith(path + "/")
  );
  const isReelsPage = location.pathname.startsWith("/reels");

  if (isLoading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono animate-pulse">
      ONYX_DRIFT_OS: CONNECTING...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />

      {/* --- 🛠️ GROUP CALL & SCHEDULE TOOLS (Floating) --- */}
      {isAuthenticated && !location.pathname.startsWith("/call") && (
        <div className="fixed bottom-24 right-6 flex flex-col gap-4 z-[999]">
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleScheduleMeeting}
            className="w-12 h-12 bg-black/60 border border-cyan-500/20 text-cyan-500 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md"
          >
            <HiCalendarDays size={24} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleInstantMeeting}
            className="w-14 h-14 bg-cyan-500 text-[#020617] rounded-3xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <FaVideo size={24} />
          </motion.button>
        </div>
      )}

      {/* =================📞 INCOMING CALL UI (1-on-1) ================= */}
      <AnimatePresence>
        {call.isReceivingCall && !callAccepted && (
          <motion.div 
            initial={{ y: -150, opacity: 0, scale: 0.9 }}
            animate={{ y: 20, opacity: 1, scale: 1 }}
            exit={{ y: -150, opacity: 0, scale: 0.9 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] w-[95%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] bg-black/80 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" />
                  <img 
                    src={call.pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.name}`} 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover z-10 relative" 
                    alt="caller" 
                  />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-[14px] font-black text-white uppercase truncate w-32 md:w-40">{call.name}</h4>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-widest animate-pulse">Incoming Private Link...</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleRejectCall} className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center active:scale-90"><HiXMark size={24} /></button>
                <button onClick={handleAnswerCall} className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center shadow-lg active:scale-90"><FaPhone size={18} /></button>
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
                <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono">Loading Neural Data...</div>}>
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