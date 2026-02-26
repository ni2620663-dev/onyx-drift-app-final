import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiXMark, HiCalendarDays } from "react-icons/hi2";
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

const INCOMING_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3";
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

  // ১. ইনস্ট্যান্ট মিটিং হ্যান্ডলার
  const handleInstantMeeting = () => {
    const roomId = `room-${Math.random().toString(36).substring(2, 10)}`;
    const groupLink = `${window.location.origin}/call/${roomId}?mode=group`;
    navigator.clipboard.writeText(groupLink);
    toast.success("Link Copied!", {
      style: { background: '#020617', color: '#06b6d4', border: '1px solid #06b6d4' },
      icon: <FaUsers className="text-cyan-400" />
    });
    navigate(`/call/${roomId}?mode=group`);
  };

  const handleScheduleMeeting = () => {
    toast("Neural Calendar Syncing...", { 
      icon: <HiCalendarDays className="text-cyan-400" />,
      style: { background: '#020617', color: '#fff' }
    });
  };

  // ২. ব্রাউজার অ্যাক্টিভেশন ট্র্যাকিং (ইন্টারভেনশন এরর ফিক্স)
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      if (incomingAudio.current) incomingAudio.current.load();
      ["click", "touchstart", "keydown"].forEach(e => window.removeEventListener(e, handleFirstInteraction));
    };

    ["click", "touchstart", "keydown"].forEach(e => window.addEventListener(e, handleFirstInteraction));

    const audio = new Audio(INCOMING_SOUND_URL);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    incomingAudio.current = audio;

    return () => {
      ["click", "touchstart", "keydown"].forEach(e => window.removeEventListener(e, handleFirstInteraction));
    };
  }, []);

  // ৩. ইউজার ডেটা সিঙ্ক
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
        } catch (err) {
          console.error("Sync Error:", err.message);
        }
      }
    };
    syncUserWithDB();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  // ৪. রিংটোন এবং ভাইব্রেশন হ্যান্ডলার (Safe Execution)
  useEffect(() => {
    let vibrationInterval;

    const safeVibrate = (pattern) => {
      if (userInteracted && typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(pattern);
        } catch (e) { /* সাইলেন্ট */ }
      }
    };

    const stopAll = () => {
      if (incomingAudio.current) {
        incomingAudio.current.pause();
        incomingAudio.current.currentTime = 0;
      }
      if (userInteracted) safeVibrate(0);
      if (vibrationInterval) clearInterval(vibrationInterval);
    };

    if (call.isReceivingCall && !callAccepted) {
      if (userInteracted) {
        incomingAudio.current?.play().catch(() => {});
        safeVibrate([500, 200, 500]);
        vibrationInterval = setInterval(() => safeVibrate([500, 200, 500]), 2000);
      }
    } else {
      stopAll();
    }

    return () => stopAll();
  }, [call.isReceivingCall, callAccepted, userInteracted]);

  const isMessengerPage = location.pathname.startsWith("/messenger") || location.pathname.startsWith("/messages");
  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => 
    location.pathname === path || location.pathname.startsWith(path + "/")
  );
  const isReelsPage = location.pathname.startsWith("/reels");

  if (isLoading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono">ONYX_DRIFT_OS: CONNECTING...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans selection:bg-cyan-500/30">
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />

      {/* Floating Buttons */}
      {isAuthenticated && isMessengerPage && (
        <div className="fixed bottom-24 right-6 flex flex-col gap-4 z-[999]">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleScheduleMeeting} className="w-12 h-12 bg-black/60 border border-cyan-500/20 text-cyan-500 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl">
            <HiCalendarDays size={24} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleInstantMeeting} className="w-14 h-14 bg-cyan-500 text-[#020617] rounded-3xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <FaVideo size={24} />
          </motion.button>
        </div>
      )}

      {/* Incoming Call UI */}
      <AnimatePresence>
        {call.isReceivingCall && !callAccepted && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] w-[95%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] bg-black/80 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" />
                  <img 
                    src={call.pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.name}`} 
                    className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover relative z-10" 
                    alt="caller"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${call.name}`;
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase truncate w-32">{call.name}</h4>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-widest animate-pulse">Incoming Link...</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => leaveCall()} className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center active:scale-95 transition-transform"><HiXMark size={24} /></button>
                <button onClick={() => { answerCall(); navigate(`/call/${call.roomId || 'session'}`); }} className="w-11 h-11 rounded-xl bg-cyan-500 text-[#020617] flex items-center justify-center active:scale-95 transition-transform"><FaPhone size={18} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full">
        <div className="flex justify-center w-full">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            {isAuthenticated && !isFullWidthPage && !isReelsPage && (
              <aside className="hidden lg:block w-[280px] sticky top-0 h-screen py-6"><Sidebar /></aside>
            )}
            <main className={`flex-1 ${isFullWidthPage ? "" : "pb-24 lg:pb-10 pt-6"}`}>
              <Suspense fallback={<div className="h-screen flex items-center justify-center text-cyan-500">Neural Loading...</div>}>
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

      {isAuthenticated && !isReelsPage && !location.pathname.startsWith("/call") && (
        <MobileNav userAuth0Id={user?.sub} />
      )}
    </div>
  );
}