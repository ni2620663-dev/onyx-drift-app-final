import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
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
import ReelsEditor from "./pages/ReelsEditor"; 
import ReelsFeed from "./pages/ReelsFeed";     
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
  const navigate = useNavigate();
  const socket = useRef(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      // সকেট কানেকশন কনফিগারেশন
      const socketUrl = "https://onyx-drift-app-final.onrender.com";
      socket.current = io(socketUrl, {
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      socket.current.on("connect", () => {
        console.log("Connected to Neural Socket");
        socket.current.emit("addNewUser", user.sub);
      });

      // --- 📞 ইনকামিং কল নোটিফিকেশন লজিক ---
      socket.current.on("incomingCall", (data) => {
        const ringtone = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
        ringtone.loop = true;
        ringtone.play().catch(e => console.log("Audio play blocked by browser"));

        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-[#0f172a]/95 border-2 border-cyan-500/50 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col gap-5 backdrop-blur-3xl min-w-[320px] z-[9999]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500 animate-pulse flex items-center justify-center text-black font-black text-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                {data.callerName?.[0] || 'C'}
              </div>
              <div>
                <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Incoming Neural Call</p>
                <p className="text-white font-black text-xl tracking-tight">{data.callerName}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  ringtone.pause();
                  toast.dismiss(t.id);
                  navigate(`/call/${data.roomId}`);
                }}
                className="flex-1 bg-cyan-500 text-black font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all active:scale-95"
              >
                Accept
              </button>
              <button 
                onClick={() => {
                  ringtone.pause();
                  socket.current.emit("rejectCall", { receiverId: data.senderId });
                  toast.dismiss(t.id);
                }}
                className="flex-1 bg-white/5 border border-white/10 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-red-500 hover:border-red-500 transition-all active:scale-95"
              >
                Decline
              </button>
            </div>
          </motion.div>
        ), { duration: 30000, position: 'top-right' }); // কল নোটিফিকেশন ৩০ সেকেন্ড থাকবে
      });

      // --- 🔔 সাধারণ নোটিফিকেশন লজিক ---
      socket.current.on("getNotification", (data) => {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-[#0f172a]/90 border border-cyan-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black uppercase">
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
        if (socket.current) {
          socket.current.off("incomingCall");
          socket.current.off("getNotification");
          socket.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, user?.sub, navigate]);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-[0.5em] text-[10px] uppercase opacity-50">{BRAND_NAME} DRIFTING...</p>
      </motion.div>
    </div>
  );

  const isFullWidthPage = [
    "/messenger", 
    "/messages", 
    "/settings", 
    "/", 
    "/join", 
    "/reels", 
    "/reels-editor"
  ].includes(location.pathname) || 
  location.pathname.startsWith("/messenger") || 
  location.pathname.startsWith("/profile/edit") ||
  location.pathname.startsWith("/call/");

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative">
      <div className="bg-grainy" />
      <Toaster />
      <CustomCursor />

      {isAuthenticated && location.pathname !== "/" && location.pathname !== "/join" && (
        <header className="w-full">
          <Navbar 
            user={user} 
            socket={socket} 
            setSearchQuery={setSearchQuery} 
            setIsPostModalOpen={setIsPostModalOpen} 
          />
        </header>
      )}
      
      <div className="flex justify-center w-full transition-all duration-500">
        <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
          
          {isAuthenticated && !isFullWidthPage && (
            <aside className="hidden lg:block w-[280px] sticky top-4 h-[calc(100vh-20px)]">
              <Sidebar />
            </aside>
          )}
          
          <main className="flex-1 flex justify-center pb-24 lg:pb-10">
            <div className={`${isFullWidthPage ? "w-full" : "w-full lg:max-w-[650px] max-w-full"}`}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
                  <Route path="/join" element={<JoinPage />} /> 
                  
                  <Route 
                    path="/feed" 
                    element={
                      <ProtectedRoute 
                        component={() => (
                          <PremiumHomeFeed 
                            searchQuery={searchQuery} 
                            isPostModalOpen={isPostModalOpen} 
                            setIsPostModalOpen={setIsPostModalOpen} 
                          />
                        )} 
                      />
                    } 
                  />

                  <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
                  <Route path="/reels-editor" element={<ProtectedRoute component={ReelsEditor} />} />
                  
                  <Route 
                    path="/messages" 
                    element={<ProtectedRoute component={() => <Messenger socket={socket} />} />} 
                  />
                  <Route 
                    path="/messenger" 
                    element={<ProtectedRoute component={() => <Messenger socket={socket} />} />} 
                  />
                  
                  <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                  <Route path="/viral" element={<ProtectedRoute component={ViralFeed} />} />
                  <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                  <Route path="/analytics" element={<ProtectedRoute component={Analytics} />} />
                  <Route path="/explorer" element={<ProtectedRoute component={Explorer} />} />
                  <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />
                  
                  <Route path="/call/:roomId" element={<ProtectedRoute component={() => <Call socket={socket} />} />} />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {isAuthenticated && !isFullWidthPage && (
            <aside className="hidden xl:block w-[320px] sticky top-4 h-[calc(100vh-20px)]">
            </aside>
          )}
        </div>
      </div>

      {isAuthenticated && <MobileNav userAuth0Id={user?.sub} />}
    </div>
  );
}