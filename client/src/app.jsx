import React, { Suspense, lazy, useMemo } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 

// Voice & Auth
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import useMasterVoiceController from "./components/GlobalVoiceAssistant";
import { supabase } from "./supabaseClient"; // Supabase ইমপোর্ট

// Components
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import ProtectedRoute from "./components/ProtectedRoute";
import MobileNav from "./components/MobileNav";

// Pages (Lazy loaded)
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
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] max-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Neural Link</span>
            </div>
            <p className="text-white/80 text-[11px] font-mono leading-tight italic">{transcript ? `"${transcript}"` : "Awaiting Command..."}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleListening} className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${listening ? 'bg-cyan-500 text-black border-white shadow-[0_0_30px_#06b6d4]' : 'bg-zinc-950/80 text-cyan-500 border-cyan-900/50 hover:border-cyan-500 shadow-2xl'}`}>
        {listening ? <Mic size={28} /> : <MicOff size={28} className="opacity-40" />}
      </motion.button>
    </div>
  );
});

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Supabase Auth Listener
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const voiceActions = useMemo(() => ({
    navigate: (path) => navigate(path),
    logout: async () => {
      if(window.confirm("Disconnect Neural Link?")) {
        await supabase.auth.signOut();
        navigate("/");
      }
    }
  }), [navigate]);

  const isFullWidthPage = useMemo(() => {
    const paths = ["/", "/join", "/messenger", "/call"];
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path));
  }, [location.pathname]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500">BOOTING_SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200">
      <Toaster position="top-right" />
      <CustomCursor />
      
      {session && <GlobalVoiceAssistant actions={voiceActions} user={session.user} />}
      
      <div className="flex w-full min-h-screen">
        {session && !isFullWidthPage && (
          <aside className="hidden md:block fixed left-0 top-0 h-full w-64 z-40 bg-[#020617]/80 backdrop-blur-md border-r border-cyan-900/20">
            <Sidebar user={session.user} />
          </aside>
        )}
        
        <main className={`flex-1 min-h-screen transition-all duration-500 ${(session && !isFullWidthPage) ? 'md:pl-64' : ''}`}>
          <Suspense fallback={<div className="h-full flex items-center justify-center text-cyan-500">LOADING_NEURAL_DATA...</div>}>
            <Routes>
              <Route path="/" element={!session ? <Landing /> : <Navigate to="/feed" />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/feed" element={session ? <PremiumHomeFeed /> : <Navigate to="/" />} />
              <Route path="/profile/:username" element={session ? <ProfilePage /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}