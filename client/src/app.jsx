import React, { Suspense, lazy, useMemo, useCallback } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useAuth0 } from '@auth0/auth0-react';

import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Hooks & Components
import useMasterVoiceController from "./components/GlobalVoiceAssistant";
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import MobileNav from "./components/MobileNav";

// Lazy Pages for Performance Optimization
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
  
  // Custom Hook to handle voice logic
  useMasterVoiceController(actions, transcript, user);

  const toggleListening = useCallback(() => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    }
  }, [listening, resetTranscript]);

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
                  <motion.div 
                    key={delay} 
                    animate={{ height: [12, 20, 12] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay }}
                    className="w-1 bg-cyan-500" 
                  />
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
        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${listening ? 'bg-cyan-500 text-black border-white shadow-[0_0_30px_#06b6d4]' : 'bg-zinc-950/80 text-cyan-500 border-cyan-900/50 hover:border-cyan-500 shadow-2xl'}`}
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth0();

  // Voice command actions memoized for performance
  const voiceActions = useMemo(() => ({
    navigate: (path) => navigate(path),
    search: (query) => navigate(`/feed?search=${query}`),
    initiateCall: () => navigate('/call'),
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } })
  }), [navigate, logout]);

  // Global Loading State (Neural Booting)
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-[0.3em] uppercase">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
        <span className="animate-pulse">Booting_Neural_Interface...</span>
      </div>
    );
  }

  const isFullWidthPage = ["/", "/join"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 selection:bg-cyan-500/30 overflow-x-hidden">
      <Toaster position="top-right" />
      <CustomCursor />

      {/* ভয়েস অ্যাসিস্ট্যান্ট শুধুমাত্র লগইন করা ইউজারদের জন্য সচল থাকবে */}
      {isAuthenticated && <GlobalVoiceAssistant actions={voiceActions} user={user} />}
      
      <div className="flex w-full min-h-screen">
        {/* Desktop Sidebar */}
        {!isFullWidthPage && isAuthenticated && (
          <aside className="hidden md:block fixed left-0 top-0 h-full w-64 z-40 bg-[#020617]/80 backdrop-blur-md border-r border-cyan-900/20">
            <Sidebar user={user} />
          </aside>
        )}
        
        {/* Mobile Navigation Bar */}
        {!isFullWidthPage && isAuthenticated && (
          <nav className="md:hidden fixed bottom-0 left-0 w-full z-50">
            <MobileNav />
          </nav>
        )}
        
        {/* Dynamic Content Area */}
        <main className={`flex-1 min-h-screen transition-all duration-500 ${(!isFullWidthPage && isAuthenticated) ? 'md:pl-64 pb-20 md:pb-0' : ''}`}>
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center text-cyan-500 animate-pulse font-mono tracking-widest bg-[#020617]">
              SYNCING_NEURAL_INTERFACE...
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
              <Route path="/join" element={isAuthenticated ? <Navigate to="/feed" replace /> : <JoinPage />} />
              
              {/* Protected Routes (Neural Core) */}
              <Route path="/feed" element={isAuthenticated ? <PremiumHomeFeed /> : <Navigate to="/" replace />} />
              <Route path="/reels" element={isAuthenticated ? <ReelsFeed /> : <Navigate to="/" replace />} />
              <Route path="/messenger/*" element={isAuthenticated ? <Messenger /> : <Navigate to="/" replace />} />
              <Route path="/profile/:username" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/" replace />} />
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" replace />} />
              <Route path="/ai-twin" element={isAuthenticated ? <AITwinSync /> : <Navigate to="/" replace />} />
              <Route path="/call" element={isAuthenticated ? <CallPage /> : <Navigate to="/" replace />} />
              
              {/* Catch-all Route (Redirects to Feed or Landing) */}
              <Route path="*" element={<Navigate to={isAuthenticated ? "/feed" : "/"} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}