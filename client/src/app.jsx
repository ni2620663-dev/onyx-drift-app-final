import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiOutlineVideoCamera, HiXMark } from "react-icons/hi2";
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

// --- 🔊 RINGTONE CONFIG (Global) ---
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
        });

        // ইনকামিং কল লজিক
        socket.current.on("incomingCall", (data) => {
          setIncomingCall(data);
          // ব্রাউজার পারমিশন থাকলে রিংটোন বাজবে
          ringtoneRef.current.play().catch(() => console.log("Audio play blocked"));
          
          toast.success(`Incoming Call: ${data.callerName}`, { 
            icon: '📞', 
            duration: 8000,
            style: { background: '#020617', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' } 
          });
        });

        // কল রিজেক্ট বা এন্ড হলে রিংটোন বন্ধ
        socket.current.on("callEnded", () => {
          stopRingtone();
          setIncomingCall(null);
        });

        socket.current.on("connect_error", (err) => console.error("Socket Error:", err.message));
      }
    }

    return () => {
      if (socket.current) {
        socket.current.off("incomingCall");
        socket.current.off("callEnded");
        socket.current.disconnect();
        socket.current = null;
      }
      stopRingtone();
    };
  }, [isAuthenticated, user?.sub]);

  const stopRingtone = () => {
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  };

  const handleAcceptCall = () => {
    stopRingtone();
    const roomId = incomingCall.roomId;
    setIncomingCall(null);
    navigate(`/call/${roomId}`);
  };

  const handleRejectCall = () => {
    stopRingtone();
    // সকেটে রিজেক্ট ইভেন্ট পাঠাতে পারেন যাতে ওপাশে 'Call Rejected' দেখায়
    socket.current?.emit("rejectCall", { to: incomingCall.callerId });
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

      {/* --- 📞 NEURAL INCOMING CALL MODAL --- */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 30, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md backdrop-blur-3xl border border-cyan-500/30 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.25)] bg-black/90"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-2xl animate-ping opacity-20" />
                  <div className="relative w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <HiOutlineVideoCamera className="text-cyan-500" size={28} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">{incomingCall.callerName || "Unknown Drifter"}</h4>
                  <p className="text-[10px] text-cyan-500 font-bold animate-pulse tracking-tighter">NEURAL LINK REQUEST...</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleRejectCall} className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10">
                  <HiXMark size={24} />
                </button>
                <button onClick={handleAcceptCall} className="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <FaPhone size={20} />
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
                      
                      <Route path="/profile/:userId" element={
                        <ProtectedRoute component={() => <Profile currentUserId={user?.sub} />} />
                      } />

                      <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />
                      <Route path="/messages/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                      <Route path="/messenger/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                      <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                      
                      {/* কল পেজ রাউট - আইডি অনুযায়ী */}
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
                   <h3 className="text-xs font-black uppercase tracking-widest text-cyan-500 mb-4">Neural Suggestions</h3>
                   <div className="space-y-4">
                      <div className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />
                      <div className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />
                   </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && !isReelsPage && <MobileNav userAuth0Id={user?.sub} />}
    </div>
  );
}