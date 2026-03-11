import React, { useEffect, useRef, useState, Suspense, lazy, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Toaster } from 'react-hot-toast';
import { Mic, MicOff } from 'lucide-react';

// Core Services & Engines
import OnyxEngine from "./core/OnyxEngine"; 
import PrivacyVault from "./core/PrivacyVault";
import OnyxGatekeeper from "./core/OnyxGatekeeper";
import IntentManager from "./core/IntentManager"; 
import GazeFocusEngine from "./core/GazeFocusEngine";
import HandGestureEngine from "./core/HandGestureEngine"; 
import { ActionDispatcher } from "./core/ActionDispatcher";
import { NeuralCore } from "./services/NeuralCore"; 

// Components
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import ProtectedRoute from "./components/ProtectedRoute";

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
   🎤 Global Voice Intelligence Engine
========================================================== */
const GlobalVoiceAssistant = React.memo(({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript;
      onCommand(transcript);
    };

    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [onCommand]);

  useEffect(() => {
    if (isListening) { try { recognitionRef.current?.start(); } catch (e) {} } 
    else { recognitionRef.current?.stop(); }
  }, [isListening]);

  return (
    <div className="fixed bottom-24 right-6 z-[99999]">
      <button 
        onClick={() => setIsListening(!isListening)} 
        className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${isListening ? 'bg-cyan-500 text-black shadow-[0_0_20px_#06b6d4]' : 'bg-zinc-900/80 text-cyan-500'}`}
      >
        {isListening ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
    </div>
  );
});

/* ==========================================================
   🚀 Main Application Core (OnyxDrift)
========================================================== */
export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastGestureTime = useRef(0);
  const isEngineInitialized = useRef(false);

  const handleNeuralCommand = useCallback(async (commandInput) => {
    const userContext = {
      isWorking: !document.hasFocus(),
      currentApp: location.pathname,
      gazeTarget: IntentManager.latestState?.gaze?.focusedElement || null,
      lastGesture: IntentManager.latestState?.gesture || null
    };
    try {
      const decision = await NeuralCore.process(commandInput, userContext);
      ActionDispatcher.execute(decision, navigate);
    } catch (err) { console.error("Action Execution Failed:", err); }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user || isEngineInitialized.current) return;

    let isMounted = true;
    isEngineInitialized.current = true;

    const startOnyxPipeline = async () => {
      try {
        await PrivacyVault.initializeVault();
        const access = await OnyxGatekeeper.verifySession(user);
        if (access !== "AUTHORIZED" || !isMounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: 30 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // AbortError এড়াতে প্রমিজ হ্যান্ডলিং
          await videoRef.current.play().catch(e => console.warn("Stream play interrupted:", e.name));
        }

        await OnyxEngine.init((type, results) => {
          if (!isMounted) return;
          if (type === "FACE" && results.multiFaceLandmarks?.[0]) {
            const nose = results.multiFaceLandmarks[0][4];
            const focusedId = GazeFocusEngine.detectFocus(nose.x * window.innerWidth, nose.y * window.innerHeight);
            IntentManager.updateSensorData("gaze", { focusedElement: focusedId });
          } else if (type === "HANDS" && results.multiHandLandmarks?.[0]) {
            const gesture = HandGestureEngine.detectGesture(results.multiHandLandmarks[0]);
            const now = Date.now();
            if (gesture !== "NONE" && now - lastGestureTime.current > 2000) {
              IntentManager.updateSensorData("gesture", gesture);
              if (gesture === "THUMBS_UP") handleNeuralCommand("LIKE_ACTION");
              lastGestureTime.current = now;
            }
          }
        });

        const processFrame = async () => {
          if (!isMounted) return;
          if (videoRef.current && videoRef.current.readyState === 4) {
             await OnyxEngine.process(videoRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(processFrame);
        };
        processFrame();

      } catch (err) { 
        if (err.name !== 'AbortError') console.error("Neural OS Initialization Failed:", err);
        isEngineInitialized.current = false; 
      }
    };

    startOnyxPipeline();

    return () => {
      isMounted = false;
      isEngineInitialized.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      OnyxEngine.terminate();
    };
  }, [isAuthenticated, user, handleNeuralCommand]);

  const isFullWidthPage = useMemo(() => {
    const fullWidthPaths = ["/messenger", "/messages", "/settings", "/join", "/reels", "/ai-twin", "/call"];
    return location.pathname === "/" || fullWidthPaths.some(path => location.pathname.startsWith(path));
  }, [location.pathname]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono">INITIALIZING_ONYX_CORE...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 overflow-x-hidden">
      <Toaster position="top-center" />
      <CustomCursor />
      
      <video 
        ref={videoRef} 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px' }} 
        autoPlay 
        playsInline 
        muted 
      />
      
      {isAuthenticated && <GlobalVoiceAssistant onCommand={handleNeuralCommand} />}

      <div className="flex flex-col lg:flex-row">
        {isAuthenticated && !isFullWidthPage && (
          <aside className="hidden lg:block w-[280px] sticky top-0 h-screen p-6 border-r border-zinc-800/50">
            <Sidebar />
          </aside>
        )}
        
        <main className="flex-1 relative">
          <Suspense fallback={<div className="h-screen flex items-center justify-center text-cyan-500 font-mono">NEURAL_STREAM_SYNCING...</div>}>
            <Routes>
              <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
              <Route path="/join" element={<JoinPage />} /> 
              <Route path="/feed" element={<ProtectedRoute><PremiumHomeFeed /></ProtectedRoute>} />
              <Route path="/reels" element={<ProtectedRoute><ReelsFeed /></ProtectedRoute>} />
              <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/messages/:userId?" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/call/:roomId" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
              <Route path="/ai-twin" element={<ProtectedRoute><AITwinSync /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}