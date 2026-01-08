import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client"; 
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_NAME } from "./utils/constants";

// Components & Pages
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Landing from "./pages/Landing"; 
import Messenger from "./pages/Messenger";
import PremiumHomeFeed from "./pages/PremiumHomeFeed";
import Analytics from "./pages/Analytics";
import Explorer from "./pages/Explorer";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
// ১. এখানে FollowingPage ইমপোর্ট করা হলো (অবশ্যই এই পাথে ফাইলটি থাকতে হবে)
import FollowingPage from "./pages/FollowingPage"; 

// Protected Route Component
const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500">
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

  // ১. সকেট কানেকশন লজিক
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const socketUrl = "https://onyx-drift-app-final.onrender.com";
      
      socket.current = io(socketUrl, {
        transports: ["polling", "websocket"], // Polling আগে রাখা ভালো কানেকশন এরর এড়াতে
        path: "/socket.io/",
        withCredentials: true,
      });

      socket.current.on("connect", () => {
        console.log("📡 Neural Link Established");
        socket.current.emit("addNewUser", user.sub);
      });

      return () => {
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [isAuthenticated, user?.sub]);

  // ২. লোডিং স্টেট
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-[0.5em] text-xs uppercase">
          {BRAND_NAME} DRIFTING...
        </p>
      </motion.div>
    </div>
  );

  const isLanding = location.pathname === "/";

  if (!isAuthenticated && !isLanding) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 overflow-x-hidden selection:bg-cyan-500/30">
      
      {isAuthenticated && (
        <div className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#020617]/80">
          <Navbar user={user} socket={socket} setSearchQuery={setSearchQuery} />
        </div>
      )}
      
      <div className={`flex justify-center w-full ${isAuthenticated ? "pt-[100px]" : "pt-0"}`}>
        <div className="flex w-full max-w-[1440px] px-4 gap-6">
          
          {/* সাইডবার লজিক: ম্যেসেঞ্জার এবং সেটিংস বাদে সব জায়গায় দেখাবে */}
          {isAuthenticated && !["/messenger", "/settings", "/"].includes(location.pathname) && (
            <aside className="hidden lg:block w-[280px] sticky top-[100px] h-[calc(100vh-120px)]">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 h-full shadow-2xl">
                <Sidebar />
              </div>
            </aside>
          )}
          
          <main className="flex-1 flex justify-center">
            <div className="w-full">
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
                  
                  {/* প্রটেক্টেড রুটস */}
                  <Route path="/feed" element={<ProtectedRoute component={() => <PremiumHomeFeed searchQuery={searchQuery} />} />} />
                  <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                  <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/analytics" element={<ProtectedRoute component={Analytics} />} />
                  <Route path="/explorer" element={<ProtectedRoute component={Explorer} />} />
                  <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                  
                  {/* ২. Following Page রাউটটি প্রটেক্টেড করা হলো */}
                  <Route path="/following" element={<ProtectedRoute component={FollowingPage} />} />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}