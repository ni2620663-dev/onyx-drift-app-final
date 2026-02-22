import React, { useEffect, useRef, useState, Suspense } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiXMark } from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";

// Stream Video SDK Imports
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

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

const apiKey = 'aw5bpt4vfj56'; // আপনার Stream API Key

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
  const [videoClient, setVideoClient] = useState(null);

  const API_AUDIENCE = "https://onyx-drift-api.com";
  const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  /* =================📡 STREAM VIDEO CLIENT SETUP ================= */
  useEffect(() => {
    if (isAuthenticated && user) {
      const cleanUserId = user.sub.replace(/[^a-zA-Z0-9]/g, "_");
      const client = new StreamVideoClient({
        apiKey,
        user: {
          id: cleanUserId,
          name: user.name,
          image: user.picture,
        },
        token: StreamVideoClient.devToken(cleanUserId),
      });
      setVideoClient(client);

      return () => {
        client.disconnectUser();
        setVideoClient(null);
      };
    }
  }, [isAuthenticated, user]);

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

  /* =================📡 SOCKET ENGINE ================= */
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      if (!socket.current) {
        socket.current = io(BACKEND_URL, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          path: '/socket.io/',
        });

        socket.current.on("connect", () => {
          socket.current.emit("addNewUser", user.sub);
        });

        socket.current.on("getCall", (data) => {
          setIncomingCall(data);
          ringtoneRef.current.play().catch(() => {});
          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        });

        socket.current.on("callRejected", () => {
          stopRingtone();
          setIncomingCall(null);
        });
      }
    }

    return () => {
      if (socket.current) {
        socket.current.off("getCall");
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
    if (!incomingCall) return;
    stopRingtone();
    const { roomId, callType } = incomingCall;
    setIncomingCall(null);
    navigate(`/call/${roomId}?mode=${callType || 'video'}`);
  };

  const handleRejectCall = () => {
    if (socket.current && incomingCall) {
      socket.current.emit("rejectCall", { to: incomingCall.from });
    }
    stopRingtone();
    setIncomingCall(null);
  };

  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
  const isReelsPage = location.pathname.startsWith("/reels");

  if (isLoading) return <div className="h-screen bg-[#020617]" />;

  return (
    <StreamVideo client={videoClient || {}}> 
      <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative overflow-x-hidden">
        <Toaster position="top-center" />
        <CustomCursor />

        {/* --- 📞 INCOMING CALL UI --- */}
        <AnimatePresence>
          {incomingCall && (
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
                    <img src={incomingCall.callerPic} className="w-14 h-14 rounded-2xl border border-cyan-500/30 object-cover" alt="caller" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-white uppercase tracking-tighter truncate">{incomingCall.callerName}</h4>
                    <p className="text-[9px] text-cyan-500 font-black tracking-widest uppercase animate-pulse">Neural Link Incoming...</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleRejectCall} className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center active:scale-90"><HiXMark size={26} /></button>
                  <button onClick={handleAcceptCall} className="w-12 h-12 rounded-2xl bg-cyan-500 text-[#020617] flex items-center justify-center shadow-lg shadow-cyan-500/20 active:scale-90"><FaPhone size={18} /></button>
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
              <main className="flex-1 flex justify-center mt-0 pb-24 lg:pb-10 pt-6">
                <div className={`${isFullWidthPage ? "w-full" : "w-full lg:max-w-[650px]"}`}>
                  <Suspense fallback={null}>
                    <Routes location={location} key={location.pathname}>
                      <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
                      <Route path="/join" element={<JoinPage />} /> 
                      <Route path="/feed" element={<ProtectedRoute component={() => <PremiumHomeFeed searchQuery={searchQuery} isPostModalOpen={isPostModalOpen} setIsPostModalOpen={setIsPostModalOpen} />} />} />
                      <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
                      <Route path="/profile/:userId" element={<ProtectedRoute component={() => <Profile currentUserId={user?.sub} />} />} />
                      <Route path="/messages/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket} />} />} />
                      <Route path="/messenger/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket} />} />} />
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
    </StreamVideo>
  );
}