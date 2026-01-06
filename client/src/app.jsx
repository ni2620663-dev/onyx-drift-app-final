import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
// sockjs এবং stompjs ব্যবহার হচ্ছে
import SockJS from 'sockjs-client';
import { over } from 'stompjs';
import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone } from "react-icons/fa";
import { BRAND_NAME, AI_NAME } from "./utils/constants";

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

const ProtectedRoute = ({ component: Component, ...props }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component);
  return <AuthenticatedComponent {...props} />;
};

export default function App() {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const stompClient = useRef(null); 
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname === "/") {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, location.pathname, loginWithRedirect]);

  // সকেট কানেকশন লজিক (CORS এবং Reconnect হ্যান্ডলিং সহ)
  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user?.sub) {
      // API URL থেকে trailing slash সরিয়ে নিন
      const socketUrl = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-api-server.onrender.com").replace(/\/$/, "");
      
      try {
        // SockJS ইনিশিয়ালাইজেশন
        socketInstance = new SockJS(`${socketUrl}/ws`);
        stompClient.current = over(socketInstance);
        
        // লগ বেশি হলে এটি ডিজেবল রাখতে পারেন
        stompClient.current.debug = null; 

        stompClient.current.connect({}, 
          () => {
            console.log("📡 Connected to OnyxDrift Neural Server (STOMP)");
            
            stompClient.current.subscribe('/topic/posts', (payload) => {
              console.log("New broadcast received via Neural link");
            });

            stompClient.current.send("/app/addNewUser", {}, JSON.stringify({ userId: user.sub }));
          }, 
          (err) => {
            // সকেট কানেকশন ফেইল হলে কনসোলে ওয়ার্নিং দিবে
            console.warn("Neural Link: Connection unstable. Retrying...");
          }
        );
      } catch (err) {
        console.error("Socket error:", err);
      }
    }

    return () => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
    };
  }, [isAuthenticated, user]);

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
          <Navbar user={user} socket={stompClient} setSearchQuery={setSearchQuery} />
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
                  <Route path="/old-home" element={<ProtectedRoute component={() => <Home user={user} searchQuery={searchQuery} />} />} />
                </Routes>
              </AnimatePresence>
            </div>
          </main>

          {isAuthenticated && !isMessenger && !isSettings && !isLanding && (
            <aside className="hidden xl:block w-[320px] sticky top-[100px] h-[calc(100vh-120px)]">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 h-full space-y-8 overflow-y-auto no-scrollbar shadow-2xl">
                
                <div className="space-y-4">
                  <h3 className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.3em]">{AI_NAME} Insight</h3>
                  <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] border border-white/5">
                    <p className="text-[11px] text-gray-400 leading-relaxed italic">
                      "Your digital aura is peaking! Today's frequency suggests high engagement with visual content."
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-purple-400 font-black text-[10px] uppercase tracking-[0.3em]">Neural Connects</h3>
                    <span className="text-[9px] text-gray-500 font-bold cursor-pointer hover:text-cyan-400 uppercase">See All</span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {[
                      { id: 1, name: "Drifter_01", status: "Online", img: "https://i.pravatar.cc/150?u=11" },
                      { id: 2, name: "Drifter_02", status: "Verified Member", img: "https://i.pravatar.cc/150?u=12" },
                      { id: 3, name: "Drifter_03", status: "Verified Member", img: "https://i.pravatar.cc/150?u=13" },
                    ].map((friend) => (
                      <div key={friend.id} className="flex items-center gap-4 group cursor-pointer p-1 rounded-2xl transition-all duration-300 hover:translate-x-1">
                        <div className="relative">
                          <img 
                            src={friend.img} 
                            className="w-10 h-10 rounded-2xl border border-white/10 group-hover:border-cyan-500/50 transition-all shadow-lg" 
                            alt={friend.name} 
                          />
                          {friend.status === "Online" && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-500 border-2 border-[#020617] rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-white group-hover:text-cyan-400 transition-colors truncate uppercase italic tracking-tighter">
                            {friend.name}
                          </p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">
                            {friend.status}
                          </p>
                        </div>

                        <button className="text-[9px] font-black uppercase text-cyan-400 hover:text-white transition-all bg-cyan-500/5 hover:bg-cyan-500 px-3 py-1.5 rounded-lg border border-cyan-500/20 active:scale-90">
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="p-4 bg-gradient-to-tr from-purple-500/10 to-cyan-500/5 border border-white/5 rounded-2xl">
                    <p className="text-[9px] font-black text-cyan-400 uppercase mb-1 tracking-widest">Network Expansion</p>
                    <p className="text-[10px] text-gray-500 leading-tight">Find drifters across the globe with Onyx Pro Connect.</p>
                  </div>
                </div>

              </div>
            </aside>
          )}

        </div>
      </div>

      {isAuthenticated && !isLanding && (
        <div className="fixed bottom-6 right-6 z-[200] lg:hidden">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-2xl shadow-lg shadow-cyan-500/20 text-black border-none cursor-pointer"
          >
            <FaMicrophone size={20} />
          </motion.button>
        </div>
      )}
    </div>
  );
}