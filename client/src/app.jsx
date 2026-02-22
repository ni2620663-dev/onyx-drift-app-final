import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
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
import FollowingPage from "./pages/FollowingPage";
import ReelsFeed from "./pages/ReelsFeed";
import ReelsEditor from "./pages/ReelsEditor";     
import Landing from "./pages/Landing"; 
import JoinPage from "./pages/JoinPage";
import CallPage from "./pages/CallPage";
import CustomCursor from "./components/CustomCursor";
import MobileNav from "./components/MobileNav";
import AITwinSync from './components/AITwinSync';

// --- 🔊 RINGTONE CONFIG ---
const callSound = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
callSound.loop = true;

// --- Protected Route Wrapper ---
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
  const socket = useRef(null); 
  const ringtoneRef = useRef(callSound);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

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
          console.log("📡 Identity Synced with Neural Grid");
        } catch (err) {
          console.error("❌ Neural Sync Error:", err.response?.data || err.message);
        }
      }
    };
    syncUserWithDB();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  /* =================📡 SOCKET & CALL ENGINE ================= */
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      if (!socket.current) {
        socket.current = io(BACKEND_URL, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          path: '/socket.io/',
          reconnection: true,
        });

        socket.current.on("connect", () => {
          socket.current.emit("addNewUser", user.sub);
          console.log("🔌 Connected to Neural Socket");
        });

        // ১. ইনকামিং কল সিগন্যাল হ্যান্ডলিং
        socket.current.on("incomingCall", (data) => {
          setIncomingCall(data);
          // ব্রাউজার পলিসি অনুযায়ী ইউজার ইন্টারঅ্যাকশন ছাড়া অডিও প্লে নাও হতে পারে
          ringtoneRef.current.play().catch(() => console.log("Audio waiting for user link..."));
          
          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

          toast(`Neural link from ${data.callerName}`, { 
            icon: '📞', 
            duration: 6000,
            style: { background: '#020617', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' } 
          });
        });

        // ২. কল রিজেক্ট বা ক্যান্সেল হলে
        socket.current.on("callRejected", () => {
          stopRingtone();
          setIncomingCall(null);
          toast.error("Neural Connection Terminated");
        });

        socket.current.on("connect_error", (err) => console.error("Socket Error:", err.message));
      }
    }

    return () => {
      if (socket.current) {
        socket.current.off("incomingCall");
        socket.current.off("callRejected");
        socket.current.disconnect();
        socket.current = null;
      }
      stopRingtone();
    };
  }, [isAuthenticated, user?.sub]);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const handleAcceptCall = () => {
    stopRingtone();
    const roomId = incomingCall.roomId;
    setIncomingCall(null);
    navigate(`/call/${roomId}`);
  };

  const handleRejectCall = () => {
    if (socket.current && incomingCall) {
        socket.current.emit("rejectCall", { to: incomingCall.from }); // 'from' is caller's ID
    }
    stopRingtone();
    setIncomingCall(null);
  };

  /* =================⌛ LOADING STATE ================= */
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    </div>
  );

  /* =================📏 LAYOUT LOGIC ================= */
  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
  const isReelsPage = location.pathname.startsWith("/reels");

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative overflow-x-hidden">
      <div className="bg-grainy" />
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />

      {/* --- 📞 GLOBAL INCOMING CALL UI (WhatsApp Style) --- */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ y: -150, opacity: 0, scale: 0.8 }}
            animate={{ y: 20, opacity: 1, scale: 1 }}
            exit={{ y: -150, opacity: 0, scale: 0.8 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100000] w-[92%] max-w-md backdrop-blur-3xl border border-cyan-500/40 p-5 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.9)] bg-black/80"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-30" />
                  <img 
                    src={incomingCall.callerPic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Onyx"} 
                    className="relative w-14 h-14 rounded-2xl border-2 border-cyan-500/50 object-cover shadow-lg shadow-cyan-500/20" 
                    alt="caller"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-black text-white uppercase tracking-widest truncate">
                    {incomingCall.callerName || "Unknown Drifter"}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    <p className="text-[9px] text-cyan-500 font-black tracking-[0.2em] uppercase">Incoming Neural Link...</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2.5">
                <button 
                  onClick={handleRejectCall} 
                  className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                >
                  <HiXMark size={26} />
                </button>
                <button 
                  onClick={handleAcceptCall} 
                  className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-90"
                >
                  <FaPhone size={18} className="animate-pulse" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full">
        <div className="flex justify-center w-full transition-all duration-500">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            
            {isAuthenticated && !isFullWidthPage && !isReelsPage && (
              <aside className="hidden lg:block w-[280px] sticky top-0 h-screen mt-0 py-6">
                <Sidebar />
              </aside>
            )}
            
            <main className={`flex-1 flex justify-center ${isFullWidthPage ? "mt-0" : "mt-0 pb-24 lg:pb-10 pt-6"}`}>
              <div className={`${isFullWidthPage ? "w-full" : "w-full lg:max-w-[650px]"}`}>
                <Suspense fallback={<div className="h-40 flex items-center justify-center text-cyan-500 font-mono animate-pulse uppercase tracking-[0.3em]">Neural Load...</div>}>
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                      <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
                      <Route path="/join" element={<JoinPage />} /> 
                      <Route path="/feed" element={<ProtectedRoute component={() => <PremiumHomeFeed searchQuery={searchQuery} isPostModalOpen={isPostModalOpen} setIsPostModalOpen={setIsPostModalOpen} />} />} />
                      <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
                      <Route path="/reels-editor" element={<ProtectedRoute component={ReelsEditor} />} />
                      <Route path="/profile/:userId" element={<ProtectedRoute component={() => <Profile currentUserId={user?.sub} />} />} />
                      <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />
                      <Route path="/messages/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                      <Route path="/messenger/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                      <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                      <Route path="/call/:roomId" element={<ProtectedRoute component={CallPage} />} />
                      <Route path="/ai-twin" element={<ProtectedRoute component={AITwinSync} />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AnimatePresence>
                </Suspense>
              </div>
            </main>

            {isAuthenticated && !isFullWidthPage && !isReelsPage && (
              <aside className="hidden xl:block w-[320px] sticky top-0 h-screen mt-0 py-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full backdrop-blur-md">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-6 flex items-center gap-2">
                     <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                     Neural Suggestions
                   </h3>
                   <div className="space-y-4">
                      <div className="h-24 w-full bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
                      <div className="h-24 w-full bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
                   </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && !isReelsPage && !location.pathname.startsWith("/call") && (
        <MobileNav userAuth0Id={user?.sub} />
      )}
    </div>
  );
}