import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 
import { HiOutlineVideoCamera, HiXMark } from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";

// Components & Pages
import Navbar from "./components/Navbar";
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

// API Configuration
const API_BASE_URL = "https://onyx-drift-app-final-u29m.onrender.com";

// Protected Route Wrapper
const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono italic uppercase tracking-widest text-xs">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          Initializing Neural Link...
        </div>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  /* =================📡 USER DATA SYNC LOGIC ================= */
  useEffect(() => {
    const syncUserWithDB = async () => {
      if (isAuthenticated && user) {
        try {
          // Audience and Scope added to prevent Refresh Token errors
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: API_BASE_URL,
              scope: "openid profile email offline_access"
            }
          });

          const userData = {
            auth0Id: user.sub,
            name: user.name,
            email: user.email,
            picture: user.picture,
            username: user.nickname || user.name?.split(' ')[0].toLowerCase(),
          };

          await axios.post(`${API_BASE_URL}/api/user/sync`, userData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("📡 Identity Synced with Neural Grid");
        } catch (err) {
          console.error("❌ Sync Error:", err.message);
        }
      }
    };
    syncUserWithDB();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  /* =================📡 SOCKET CONFIGURATION ================= */
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      if (!socket.current) {
        socket.current = io(API_BASE_URL, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
        });

        socket.current.on("connect", () => {
          console.log("Connected to Onyx Server");
          socket.current.emit("addNewUser", user.sub);
        });

        socket.current.on("incomingCall", (data) => {
          setIncomingCall(data);
          // Play notification sound here if needed
        });

        socket.current.on("connect_error", (err) => {
          console.warn("Socket connection error, retrying...");
        });
      }

      return () => {
        if (socket.current) {
          socket.current.disconnect();
          socket.current = null;
        }
      };
    }
  }, [isAuthenticated, user?.sub]);

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
  const isMessengerPage = location.pathname.includes("/messages") || location.pathname.includes("/messenger");
  const isReelsPage = location.pathname.startsWith("/reels");
  const isFeedPage = location.pathname.startsWith("/feed"); 
  const isAuthPage = location.pathname === "/" || location.pathname === "/join";
  const isCallPage = location.pathname.startsWith("/call/");

  const isFullWidthPage = isMessengerPage || isAuthPage || isReelsPage || isCallPage || location.pathname === "/settings";

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      <div className="bg-grainy" />
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />

      {/* --- 📞 GLOBAL INCOMING CALL MODAL --- */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md bg-zinc-900/90 backdrop-blur-2xl border border-cyan-500/30 p-5 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.2)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center animate-pulse">
                  <HiOutlineVideoCamera className="text-cyan-500" size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">{incomingCall.callerName || "Unknown Drifter"}</h4>
                  <p className="text-[10px] text-cyan-500 font-bold animate-pulse uppercase">Neural Call Incoming...</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIncomingCall(null)}
                  className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                  <HiXMark size={20} />
                </button>
                <button 
                  onClick={() => {
                    navigate(`/call/${incomingCall.roomId}`);
                    setIncomingCall(null);
                  }}
                  className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <FaPhone size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full">
        {/* Navbar condition */}
        {isAuthenticated && !isAuthPage && !isReelsPage && !isCallPage && !isMessengerPage && (
          <Navbar 
            user={user} 
            socket={socket.current} 
            setSearchQuery={setSearchQuery} 
            setIsPostModalOpen={setIsPostModalOpen}
          />
        )}
        
        <div className="flex justify-center w-full transition-all duration-500">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            
            {/* Sidebar Left */}
            {isAuthenticated && !isFullWidthPage && (
              <aside className="hidden lg:block w-[280px] sticky top-6 h-[calc(100vh-48px)] mt-6">
                <Sidebar />
              </aside>
            )}
            
            {/* Main Content Area */}
            <main className={`flex-1 flex justify-center ${isFullWidthPage ? "mt-0" : "mt-6 pb-24 lg:pb-10"}`}>
              <div className={`${isFullWidthPage ? "w-full" : "w-full lg:max-w-[650px] max-w-full"}`}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
                    <Route path="/join" element={<JoinPage />} /> 

                    <Route path="/feed" element={
                      <ProtectedRoute component={() => 
                        <PremiumHomeFeed 
                          searchQuery={searchQuery} 
                          isPostModalOpen={isPostModalOpen} 
                          setIsPostModalOpen={setIsPostModalOpen} 
                        />} 
                      />} 
                    />
                    
                    <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
                    <Route path="/reels-editor" element={<ProtectedRoute component={ReelsEditor} />} />
                    <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                    <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />

                    <Route path="/messages/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                    <Route path="/messenger/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                    
                    <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                    <Route path="/call/:roomId" element={<ProtectedRoute component={CallPage} />} />
                    <Route path="/ai-twin" element={<ProtectedRoute component={AITwinSync} />} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AnimatePresence>
              </div>
            </main>

            {/* Sidebar Right Suggestions */}
            {isAuthenticated && !isFullWidthPage && (
              <aside className="hidden xl:block w-[320px] sticky top-6 h-[calc(100vh-48px)] mt-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full backdrop-blur-md">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-6 flex items-center gap-2">
                     <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                     Neural Suggestions
                   </h3>
                   <div className="space-y-4">
                      <div className="h-24 w-full bg-white/5 border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
                        <p className="text-[10px] text-gray-500 italic">Scanning grid for peers...</p>
                      </div>
                      <div className="h-24 w-full bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
                   </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && !isReelsPage && !isCallPage && (
        <MobileNav userAuth0Id={user?.sub} />
      )}
    </div>
  );
}