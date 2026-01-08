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

// Protected Route Component
const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component);
  return <AuthenticatedComponent {...props} />;
};

export default function App() {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const socket = useRef(null); 
  const [searchQuery, setSearchQuery] = useState("");

  // ১. Auth0 Auto Login Redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== "/") {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, location.pathname, loginWithRedirect]);

  // ২. Socket.io Connection Logic (Fixed 404 & 500 issues)
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      /**
       * ফিক্স: স্ক্রিনশটে দেখা যাচ্ছে আপনি REACT_APP_API_URL ব্যবহার করছেন। 
       * কিন্তু Vite-এ ভেরিয়েবল অবশ্যই VITE_ দিয়ে শুরু হতে হবে। 
       * যতক্ষণ না আপনি Render ড্যাশবোর্ডে ওটা চেঞ্জ করছেন, আমি সরাসরি হার্ডকোড করে দিচ্ছি যাতে এরর না আসে।
       */
      const socketUrl = "https://onyx-drift-app-final.onrender.com";
      
      // সকেট ইনিশিয়ালাইজেশন
      socket.current = io(socketUrl, {
        transports: ["websocket", "polling"], // রেন্ডারের জন্য সিকোয়েন্স জরুরি
        path: "/socket.io/", // নিশ্চিত করবে যে সঠিক এন্ডপয়েন্টে যাচ্ছে
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.current.on("connect", () => {
        console.log("📡 Neural Link Established: Connected to onyx-drift-app-final");
        socket.current.emit("addNewUser", user.sub);
      });

      // Java ব্যাকেন্ড থেকে লাইভ পোস্ট রিসিভ
      socket.current.on("receiveNewPost", (newPost) => {
        console.log("🔥 Live post from Java Engine:", newPost);
        window.dispatchEvent(new CustomEvent("new_post_arrived", { detail: newPost }));
      });

      socket.current.on("connect_error", (err) => {
        if (socket.current?.active) {
            console.warn("Neural Link Signal Weak: Retrying connection...");
        }
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
          console.log("📡 Neural Link Severed");
        }
      };
    }
  }, [isAuthenticated, user?.sub]);

  // Loading State UI
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-cyan-400 font-black tracking-[0.5em] text-xs uppercase italic animate-pulse">
          {BRAND_NAME} DRIFTING...
        </p>
      </motion.div>
    </div>
  );

  const isMessenger = location.pathname === "/messenger";
  const isSettings = location.pathname === "/settings";
  const isExplorer = location.pathname === "/explorer";
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 overflow-x-hidden selection:bg-cyan-500/30 font-sans">
      
      {isAuthenticated && !isLanding && (
        <div className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-[#020617]/80">
          <Navbar user={user} socket={socket} setSearchQuery={setSearchQuery} />
        </div>
      )}
      
      <div className={`flex justify-center w-full ${isAuthenticated && !isLanding ? "pt-[100px]" : "pt-0"}`}>
        <div className="flex w-full max-w-[1440px] px-4 gap-6">
          
          {isAuthenticated && !isMessenger && !isSettings && !isLanding && (
            <aside className="hidden lg:block w-[280px] sticky top-[100px] h-[calc(100vh-120px)]">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 h-full shadow-2xl overflow-y-auto no-scrollbar">
                <Sidebar />
              </div>
            </aside>
          )}
          
          <main className={`flex-1 flex justify-center transition-all duration-500
            ${isMessenger || isExplorer || isSettings || isLanding ? "max-w-full" : "max-w-[720px] mx-auto"}`}>
            <div className="w-full">
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
                  <Route path="/feed" element={<ProtectedRoute component={() => <PremiumHomeFeed searchQuery={searchQuery} />} />} />
                  <Route path="/profile/:userId" element={<ProtectedRoute component={Profile} />} />
                  <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
                  <Route path="/analytics" element={<ProtectedRoute component={Analytics} />} />
                  <Route path="/explorer" element={<ProtectedRoute component={Explorer} />} />
                  <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {isAuthenticated && !isMessenger && !isSettings && !isLanding && (
            <aside className="hidden xl:block w-[320px] sticky top-[100px] h-[calc(100vh-120px)]">
                {/* Right Sidebar Content */}
            </aside>
          )}
          
        </div>
      </div>
    </div>
  );
}