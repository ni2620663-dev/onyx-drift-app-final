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

// --- 📞 CUSTOM CALL CONTEXT IMPORT ---
import { useCall } from './context/CallContext';

// --- 🔊 RINGTONE CONFIG ---
const INCOMING_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3";
const OUTGOING_SOUND_URL = "https://www.soundjay.com/phone/phone-calling-1.mp3";

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
  
  // Call Context থেকে ডাটা নেওয়া
  const { 
    call, 
    callAccepted, 
    answerCall, 
    leaveCall,
    stream 
  } = useCall();

  const incomingAudio = useRef(new Audio(INCOMING_SOUND_URL));
  const outgoingAudio = useRef(new Audio(OUTGOING_SOUND_URL));
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

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

  /* =================📡 RINGTONE LOGIC ================= */
  useEffect(() => {
    // ইনকামিং কল রিংটোন
    if (call.isReceivingCall && !callAccepted) {
      incomingAudio.current.loop = true;
      incomingAudio.current.play().catch(() => {});
      if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    } else {
      incomingAudio.current.pause();
      incomingAudio.current.currentTime = 0;
    }

    return () => {
      incomingAudio.current.pause();
    };
  }, [call.isReceivingCall, callAccepted]);

  const handleAnswerCall = () => {
    answerCall(); // Context ফাংশন
    navigate(`/call/${call.from || 'room'}`); 
  };

  const handleRejectCall = () => {
    leaveCall(); // Context ফাংশন (ক্যামেরা অফ করবে ও রিলোড দিবে)
  };

  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
  const isReelsPage = location.pathname.startsWith("/reels");

  if (isLoading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono">Connecting to Onyx Grid...</div>;

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
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] w-[92%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] bg-black/80 shadow-2xl shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" />
                  <img src={call.pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Onyx"} className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover" alt="caller" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-white uppercase tracking-tighter truncate">{call.name || "Unknown Link"}</h4>
                  <p className="text-[9px] text-cyan-500 font-black tracking-widest uppercase animate-pulse">Incoming Neural Link...</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRejectCall} className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center active:scale-90 transition-transform"><HiXMark size={26} /></button>
                <button onClick={handleAnswerCall} className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-90 transition-transform"><FaPhone size={18} /></button>
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