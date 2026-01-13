import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { BRAND_NAME } from "./utils/constants";

// Components & Pages
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Messenger from "./pages/Messenger";
import PremiumHomeFeed from "./pages/PremiumHomeFeed";
import Analytics from "./pages/Analytics";
import Explorer from "./pages/Explorer";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FollowingPage from "./pages/FollowingPage";
import Call from "./pages/Call";
import ViralFeed from "./pages/ViralFeed"; 
import JoinPage from "./pages/JoinPage"; 
import Landing from "./pages/Landing"; 
import CustomCursor from "./components/CustomCursor";
import MobileNav from "./components/MobileNav";

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
  const { isAuthenticated, isLoading, user } = useAuth0();
  const location = useLocation();
  const socket = useRef(null); 
  const [searchQuery, setSearchQuery] = useState("");

  // --- Socket.io Integration ---
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const socketUrl = "https://onyx-drift-app-final.onrender.com";
      socket.current = io(socketUrl, {
        transports: ["polling", "websocket"],
        path: "/socket.io/",
        withCredentials: true,
      });

      socket.current.on("connect", () => {
        socket.current.emit("addNewUser", user.sub);
      });

      socket.current.on("getNotification", (data) => {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-[#0f172a]/80 border border-cyan-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black uppercase shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              {data.senderName?.[0] || 'N'}
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight">{data.senderName}</p>
              <p className="text-cyan-400/80 text-[11px] font-medium leading-none mt-1">
                {data.message || `Interacted with your neural node`}
              </p>
            </div>
          </motion.div>
        ), { duration: 4000, position: 'top-right' });
      });

      return () => {
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [isAuthenticated, user?.sub]);

  // --- Loading State ---
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-[0.5em] text-[10px] uppercase opacity-50">{BRAND_NAME} DRIFTING...</p>
      </motion.div>
    </div>
  );

  // --- Layout logic ---
  const isFullWidthPage = ["/messenger", "/settings", "/", "/join"].includes(location.pathname) || 
                          location.pathname.startsWith("/messenger") || 
                          location.pathname.startsWith("/call/");

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 overflow-x-hidden font-sans relative">
      {/* Background Texture Overlay */}
      <div className="bg-grainy" />
      
      <Toaster />
      <CustomCursor />

      {/* Navbar - Fixed at top */}
      {isAuthenticated && (
        <Navbar user={user} socket={socket} setSearchQuery={setSearchQuery} />
      )}
      
      {/* Main Layout */}
      <div className={`flex justify-center w-full transition-all duration-500 ${isAuthenticated ? "pt-20" : "pt-0"}`}>
        <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-4"} gap-6`}>
          
          {/* Sidebar Left - Hidden on FullWidth/Mobile */}
          {isAuthenticated && !isFullWidthPage && (
            <aside className="hidden lg:block w-[280px] sticky top-[95px] h-[calc(100vh-115px)]">
              <Sidebar />
            </aside>
          )}
          
          {/* Main Content Area - Centered for Feed */}
          <main className={`flex-1 flex justify-center pb-24 lg:pb-10`}>
            <div className={`${isFullWidthPage ? "w-full" : "w-full max-w-[680px]"}`}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {/* Landing & Authentication */}
                  <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
                  <Route path="/join" element={<JoinPage />} /> 
                  
                  {/* Neural Feed & Core Pages */}
                  <Route path="/feed" element={<ProtectedRoute component={() => <PremiumHomeFeed searchQuery={searchQuery} />} />} />
                  <Route path="/reels" element={<ProtectedRoute component={ViralFeed} />} />
                  <Route path="/viral" element={<ProtectedRoute component={ViralFeed} />} />
                  <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                  <Route path="/messages" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
                  
                  {/* Utils */}
                  <Route path="/analytics" element={<ProtectedRoute component={Analytics} />} />
                  <Route path="/explorer" element={<ProtectedRoute component={Explorer} />} />
                  <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                  <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />
                  <Route path="/call/:roomId" element={<ProtectedRoute component={Call} />} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {/* Right Sidebar Placeholder (Optional) */}
          {isAuthenticated && !isFullWidthPage && (
            <aside className="hidden xl:block w-[320px] sticky top-[95px] h-[calc(100vh-115px)]">
              {/* এখানে আপনি Trending বা Suggestion এর জন্য কিছু রাখতে পারেন */}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only for Authenticated Users */}
      {isAuthenticated && <MobileNav userAuth0Id={user?.sub} />}

    </div>
  );
}