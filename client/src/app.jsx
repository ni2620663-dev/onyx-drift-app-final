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
  
  // মডাল স্টেট: Navbar এবং HomeFeed এর মধ্যে কাজ করবে
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

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
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [isAuthenticated, user?.sub]);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-[0.5em] text-[10px] uppercase opacity-50">{BRAND_NAME} DRIFTING...</p>
      </motion.div>
    </div>
  );

  const isFullWidthPage = ["/messenger", "/settings", "/", "/join"].includes(location.pathname) || 
                          location.pathname.startsWith("/messenger") || 
                          location.pathname.startsWith("/call/");

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 font-sans relative">
      <div className="bg-grainy" />
      <Toaster />
      <CustomCursor />

      {/* ১. Navbar: এটি এখন sticky নয়, স্ক্রলের সাথে ওপরে উঠে যাবে */}
      {isAuthenticated && (
        <header className="w-full">
          <Navbar 
            user={user} 
            socket={socket} 
            setSearchQuery={setSearchQuery} 
            setIsPostModalOpen={setIsPostModalOpen} 
          />
        </header>
      )}
      
      {/* ২. মেইন লেআউট স্ট্রাকচার: pt (padding-top) রিমুভ করা হয়েছে যাতে গ্যাপ না থাকে */}
      <div className="flex justify-center w-full transition-all duration-500">
        <div className={`flex w-full ${isFullWidthPage ? "max-w-full" : "max-w-[1440px] px-0 lg:px-6"} gap-6`}>
          
          {/* লেফট সাইডবার: এটি শুধুমাত্র ডেস্কটপে ফিক্সড থাকবে */}
          {isAuthenticated && !isFullWidthPage && (
            <aside className="hidden lg:block w-[280px] sticky top-4 h-[calc(100vh-20px)]">
              <Sidebar />
            </aside>
          )}
          
          {/* ফিড কন্টেন্ট এরিয়া */}
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

                  <Route path="/reels" element={<ProtectedRoute component={ViralFeed} />} />
                  <Route path="/viral" element={<ProtectedRoute component={ViralFeed} />} />
                  <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                  <Route path="/messages" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/analytics" element={<ProtectedRoute component={Analytics} />} />
                  <Route path="/explorer" element={<ProtectedRoute component={Explorer} />} />
                  <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                  <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />
                  <Route path="/call/:roomId" element={<ProtectedRoute component={Call} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {/* রাইট সাইডবার */}
          {isAuthenticated && !isFullWidthPage && (
            <aside className="hidden xl:block w-[320px] sticky top-4 h-[calc(100vh-20px)]">
               {/* ট্রেন্ডিং সেকশন */}
            </aside>
          )}
        </div>
      </div>

      {/* ৩. মোবাইল নেভিগেশন (ফুটার): এটি নিচে ফিক্সড থাকবে */}
      {isAuthenticated && <MobileNav userAuth0Id={user?.sub} />}
    </div>
  );
}