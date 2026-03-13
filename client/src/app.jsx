import React, { useEffect, useRef, useState, Suspense, lazy, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Toaster } from 'react-hot-toast';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 

import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Master Voice Hook
import useMasterVoiceController from "./hooks/MasterVoiceController";

// Components
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import ProtectedRoute from "./components/ProtectedRoute";
import NeuralVirtualTouch from "./components/NeuralVirtualTouch";
import MobileNav from "./components/MobileNav"; // MobileNav ইম্পোর্ট করা হলো

// Pages
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
    🎤 Global Voice Intelligence (Master Assistant)
========================================================== */
const GlobalVoiceAssistant = React.memo(({ actions }) => {
  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();
  
  useMasterVoiceController(actions, transcript);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    }
  };

  if (!browserSupportsSpeechRecognition) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[99999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {listening && transcript && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-black/90 border border-cyan-500/30 px-4 py-2 rounded-xl text-[10px] text-cyan-400 font-mono uppercase tracking-tighter shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            {transcript.length > 30 ? transcript.substring(transcript.length - 30) : transcript}
          </motion.div>
        )}
      </AnimatePresence>
      
      <button 
        onClick={toggleListening} 
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
          listening 
            ? 'bg-cyan-500 text-black border-white shadow-[0_0_30px_#06b6d4] scale-110' 
            : 'bg-zinc-950/80 text-cyan-500 border-cyan-900/50 hover:border-cyan-500'
        }`}
      >
        {listening ? <Mic size={24} className="animate-pulse" /> : <MicOff size={24} className="opacity-50" />}
      </button>
    </div>
  );
});

/* ==========================================================
    🚀 Main Application Core (OnyxDrift)
========================================================== */
export default function App() {
  const { isAuthenticated, isLoading, user, logout: auth0Logout } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();

  const voiceActions = useMemo(() => ({
    navigate: (path) => navigate(path),
    searchUser: (query) => navigate(`/feed?search=${query}`),
    initiateCall: () => navigate('/call'),
    handleLike: () => {
      const likeBtn = document.querySelector('[data-action="like"]') || document.querySelector('.heart-icon');
      if (likeBtn) likeBtn.click();
    },
    logout: () => {
      if(window.confirm("Disconnect Neural Link (Logout)?")) {
        auth0Logout({ returnTo: window.location.origin });
      }
    }
  }), [navigate, auth0Logout]);

  const isFullWidthPage = useMemo(() => {
    const paths = ["/", "/join", "/messenger", "/reels", "/call", "/settings"];
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path));
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-[0.5em]">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6" />
        <span className="animate-pulse">BOOTING_ONYX_SYSTEM...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 selection:bg-cyan-500/30 overflow-x-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#020617', border: '1px solid #0891b2', color: '#06b6d4', fontFamily: 'monospace', fontSize: '12px' } }} />
      
      <CustomCursor />
      <NeuralVirtualTouch />
      {isAuthenticated && <GlobalVoiceAssistant actions={voiceActions} />}
      
      <div className="flex w-full min-h-screen">
        {/* ডেস্কটপ সাইডবার (শুধুমাত্র MD স্ক্রিন বা তার উপরে দেখাবে) */}
        {!isFullWidthPage && isAuthenticated && (
          <div className="hidden md:block fixed left-0 top-0 h-full w-64 z-40 bg-[#020617]/95 border-r border-cyan-900/20">
            <Sidebar user={user} />
          </div>
        )}
        
        {/* মোবাইল নেভিগেশন (শুধুমাত্র মোবাইলে দেখাবে) */}
        {!isFullWidthPage && isAuthenticated && (
          <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
            <MobileNav />
          </div>
        )}
        
        {/* মেইন কন্টেন্ট এরিয়া */}
        <main className={`flex-1 min-h-screen transition-all duration-300 ${(!isFullWidthPage && isAuthenticated) ? 'md:pl-64' : 'pl-0'}`}>
          <Suspense fallback={<div className="h-full flex items-center justify-center text-cyan-500 font-mono text-xs animate-pulse">Syncing...</div>}>
             <div className="w-full h-full">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/feed" element={<ProtectedRoute><PremiumHomeFeed /></ProtectedRoute>} />
                <Route path="/reels" element={<ProtectedRoute><ReelsFeed /></ProtectedRoute>} />
                <Route path="/messenger/*" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/ai-twin" element={<ProtectedRoute><AITwinSync /></ProtectedRoute>} />
                <Route path="/call" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}