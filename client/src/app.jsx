import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios'; 

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

// Protected Route Wrapper
const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono italic uppercase tracking-widest">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  /* =================📡 USER DATA SYNC LOGIC ================= */
  useEffect(() => {
    const syncUserWithDB = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently();
          const userData = {
            auth0Id: user.sub,
            name: user.name,
            email: user.email,
            picture: user.picture,
            username: user.nickname || user.name?.split(' ')[0].toLowerCase(),
          };

          await axios.post('https://onyx-drift-app-final-u29m.onrender.com/api/user/sync', userData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("📡 Identity Synced with Neural Grid");
        } catch (err) {
          console.error("❌ Sync Error:", err);
        }
      }
    };
    syncUserWithDB();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  /* =================📡 SOCKET CONFIGURATION ================= */
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const socketUrl = "https://onyx-drift-app-final-u29m.onrender.com";
      
      if (!socket.current) {
        socket.current = io(socketUrl, {
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        socket.current.on("connect", () => {
          console.log("Connected to Onyx Server");
          socket.current.emit("addNewUser", user.sub);
        });

        socket.current.on("incomingCall", (data) => {
          toast(`Incoming ${data.type} call...`, { 
            icon: '📞',
            style: {
              borderRadius: '10px',
              background: '#0f172a',
              color: '#fff',
              border: '1px solid #06b6d4'
            }
          });
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
  const isFullWidthPage = [
    "/messenger", "/messages", "/settings", "/", "/join", "/reels", "/feed"
  ].some(path => location.pathname === path || location.pathname.startsWith(path + "/"));

  const isReelsPage = location.pathname.startsWith("/reels");
  const isFeedPage = location.pathname.startsWith("/feed"); 
  const isAuthPage = ["/", "/join"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative overflow-x-hidden">
      <div className="bg-grainy" />
      <Toaster position="top-center" reverseOrder={false} />
      <CustomCursor />

      <div className="flex flex-col w-full">
        
        {/* --- 1. NAVBAR (HIDDEN ON AUTH, REELS, & FEED) --- */}
        {isAuthenticated && !isAuthPage && !isReelsPage && !isFeedPage && (
          <Navbar 
            user={user} 
            socket={socket.current} 
            setSearchQuery={setSearchQuery} 
            setIsPostModalOpen={setIsPostModalOpen}
            toggleSidebar={() => {}} 
          />
        )}
        
        {/* --- 2. MAIN LAYOUT --- */}
        <div className="flex justify-center w-full transition-all duration-500">
          <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
            
            {/* LEFT SIDEBAR (SHOWN ONLY ON PROFILE/FOLLOWING TYPE PAGES) */}
            {isAuthenticated && !isFullWidthPage && (
              <aside className="hidden lg:block w-[280px] sticky top-6 h-[calc(100vh-40px)] mt-6">
                <Sidebar />
              </aside>
            )}
            
            {/* MAIN CONTENT AREA */}
            <main className={`flex-1 flex justify-center ${isFullWidthPage ? "mt-0 pb-0" : "mt-6 pb-24 lg:pb-10"}`}>
              <div className={`${isFullWidthPage ? "w-full" : "w-full lg:max-w-[650px] max-w-full"}`}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    {/* Public Routes */}
                    <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
                    <Route path="/join" element={<JoinPage />} /> 

                    {/* Private Routes */}
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

                    {/* Messaging */}
                    <Route path="/messages/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                    <Route path="/messenger/:userId?" element={<ProtectedRoute component={() => <Messenger socket={socket.current} />} />} />
                    
                    {/* Others */}
                    <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                    <Route path="/call/:roomId" element={<ProtectedRoute component={CallPage} />} />
                    
                    {/* Redirects */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AnimatePresence>
              </div>
            </main>

            {/* RIGHT SIDEBAR (NEURAL SUGGESTIONS) */}
            {isAuthenticated && !isFullWidthPage && (
              <aside className="hidden xl:block w-[320px] sticky top-6 h-[calc(100vh-40px)] mt-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full backdrop-blur-md">
                   <h3 className="text-xs font-black uppercase tracking-widest text-cyan-500 mb-4">Neural Suggestions</h3>
                   <div className="space-y-4">
                      <p className="text-gray-500 text-xs italic">Syncing with drift...</p>
                      <div className="h-20 w-full bg-white/5 rounded-xl animate-pulse" />
                   </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      {isAuthenticated && !isReelsPage && <MobileNav userAuth0Id={user?.sub} />}
    </div>
  );
}