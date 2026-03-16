import React, { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Toaster } from 'react-hot-toast';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 

import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Hooks & Components
import useMasterVoiceController from "./components/GlobalVoiceAssistant";
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import ProtectedRoute from "./components/ProtectedRoute";
import MobileNav from "./components/MobileNav";

// Lazy Pages
const Messenger = lazy(() => import("./pages/Messenger"));
const PremiumHomeFeed = lazy(() => import("./pages/PremiumHomeFeed"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings")); 
const ReelsFeed = lazy(() => import("./pages/ReelsFeed"));
const Landing = lazy(() => import("./pages/Landing"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const CallPage = lazy(() => import("./pages/CallPage"));
const AITwinSync = lazy(() => import("./components/AITwinSync"));

/* ==========================================================
   🎤 Global Voice Intelligence (Neural Interface)
========================================================== */
const GlobalVoiceAssistant = React.memo(({ actions, user }) => {
  const { transcript, listening, browserSupportsSpeechRecognition, resetTranscript } = useSpeechRecognition();
  
  useMasterVoiceController(actions, transcript, user);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    }
  };

  if (!browserSupportsSpeechRecognition) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[99999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {listening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] max-w-[220px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map((delay) => (
                  <div key={delay} className="w-1 h-3 bg-cyan-500 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Neural Link</span>
            </div>
            <p className="text-white/80 text-[11px] font-mono leading-tight italic">
              {transcript ? `"${transcript}"` : "Awaiting Command..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleListening} 
        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
          listening ? 'bg-cyan-500 text-black border-white shadow-[0_0_30px_#06b6d4]' : 'bg-zinc-950/80 text-cyan-500 border-cyan-900/50 hover:border-cyan-500 shadow-2xl'
        }`}
      >
        {listening ? <Mic size={28} /> : <MicOff size={28} className="opacity-40" />}
      </motion.button>
    </div>
  );
});

/* ==========================================================
   🚀 Main Application Core (OnyxDrift)
========================================================== */
export default function App() {
  const { isAuthenticated: isAuth0Authenticated, isLoading: isAuth0Loading, user: auth0User, logout: auth0Logout } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();

  // --- কাস্টম অথ স্টেট (LocalStorage থেকে) ---
  const [customUser, setCustomUser] = useState(() => {
    const savedUser = localStorage.getItem("onyx_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ফাইনাল ইউজার এবং অথ চেক (উভয় মেথডের জন্য)
  const isAuthenticated = isAuth0Authenticated || !!customUser;
  const currentUser = auth0User || customUser;

  const logout = () => {
    if(window.confirm("Disconnect Neural Link?")) {
      localStorage.removeItem("onyx_user"); // কাস্টম ইউজার ডিলিট
      setCustomUser(null);
      if (isAuth0Authenticated) {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
      } else {
        navigate("/");
      }
    }
  };

  const voiceActions = useMemo(() => ({
    navigate: (path) => navigate(path),
    search: (query) => navigate(`/feed?search=${query}`),
    initiateCall: () => navigate('/call'),
    handleLike: () => document.querySelector('[data-action="like"]')?.click(),
    logout: logout
  }), [navigate, isAuth0Authenticated, auth0Logout]);

  const isFullWidthPage = useMemo(() => {
    const paths = ["/", "/join"];
    return paths.includes(location.pathname);
  }, [location.pathname]);

  if (isAuth0Loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-[0.5em]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full mb-8" 
        />
        <span>BOOTING_SYSTEM...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 selection:bg-cyan-500/30 overflow-x-hidden">
      <Toaster position="top-right" />
      <CustomCursor />

      {isAuthenticated && <GlobalVoiceAssistant actions={voiceActions} user={currentUser} />}
      
      <div className="flex w-full min-h-screen">
        {!isFullWidthPage && isAuthenticated && (
          <aside className="hidden md:block fixed left-0 top-0 h-full w-64 z-40 bg-[#020617]/80 backdrop-blur-md border-r border-cyan-900/20">
            <Sidebar user={currentUser} />
          </aside>
        )}
        
        {!isFullWidthPage && isAuthenticated && (
          <nav className="md:hidden fixed bottom-0 left-0 w-full z-50">
            <MobileNav />
          </nav>
        )}
        
        <main className={`flex-1 min-h-screen transition-all duration-500 ${(!isFullWidthPage && isAuthenticated) ? 'md:pl-64 pb-20 md:pb-0' : ''}`}>
          <Suspense fallback={<div className="h-full flex items-center justify-center text-cyan-500 animate-pulse">LOADING_NEURAL_DATA...</div>}>
            <Routes>
              {/* রুট হ্যান্ডলিং */}
              <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
              <Route path="/join" element={isAuthenticated ? <Navigate to="/feed" replace /> : <JoinPage />} />
              
              {/* ফিড এবং অন্যান্য সুরক্ষিত রাউট */}
              <Route path="/feed" element={isAuthenticated ? <PremiumHomeFeed /> : <Navigate to="/" replace />} />
              <Route path="/reels" element={isAuthenticated ? <ReelsFeed /> : <Navigate to="/" replace />} />
              <Route path="/messenger/*" element={isAuthenticated ? <Messenger /> : <Navigate to="/" replace />} />
              <Route path="/profile/:username" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/" replace />} />
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" replace />} />
              <Route path="/ai-twin" element={isAuthenticated ? <AITwinSync /> : <Navigate to="/" replace />} />
              <Route path="/call" element={isAuthenticated ? <CallPage /> : <Navigate to="/" replace />} />
              
              <Route path="*" element={<Navigate to={isAuthenticated ? "/feed" : "/"} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
