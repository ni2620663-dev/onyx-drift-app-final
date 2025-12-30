import React, { useEffect, useRef } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { io } from "socket.io-client";

// কম্পোনেন্ট ও পেজ ইমপোর্ট
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Messenger from "./pages/Messenger";
import Notifications from "./pages/Notifications";
import Watch from "./pages/Watch";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";

const ProtectedRoute = ({ component }) => {
  const Component = withAuthenticationRequired(component);
  return <Component />;
};

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const location = useLocation();
  const socket = useRef();

  useEffect(() => {
    if (isAuthenticated && user) {
      // ✅ সকেট কানেকশন ঠিক করা হয়েছে
      socket.current = io("http://localhost:10000", {
        transports: ["websocket", "polling"], 
        reconnectionAttempts: 5,
        withCredentials: true
      });

      socket.current.emit("addNewUser", user.sub);
    }

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [isAuthenticated, user]);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505] text-blue-500 text-2xl font-black animate-pulse">
      ONYX DRIFT...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-blue-500/30">
      
      {isAuthenticated && <Navbar socket={socket} />}
      
      <div className="flex max-w-[1440px] mx-auto pt-[60px]">
        {isAuthenticated && location.pathname !== "/" && (
          <div className="hidden lg:block w-[300px] sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto px-4">
            <Sidebar />
          </div>
        )}
        
        <main className="flex-1 w-full min-h-screen">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
            <Route path="/feed" element={<ProtectedRoute component={Home} />} /> 
            <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
            <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
            <Route path="/friends" element={<ProtectedRoute component={Friends} />} />
            <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
            <Route path="/notifications" element={<ProtectedRoute component={Notifications} />} /> 
            <Route path="/watch" element={<ProtectedRoute component={Watch} />} />
            <Route path="/marketplace" element={<ProtectedRoute component={Marketplace} />} />

            <Route path="*" element={
              <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <h1 className="text-9xl font-black text-white/5 tracking-tighter">404</h1>
                <p className="text-gray-500 uppercase tracking-widest font-bold">Page Not Found</p>
                <button onClick={() => window.location.href="/"} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all active:scale-95">
                  BACK TO DRIFT
                </button>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}