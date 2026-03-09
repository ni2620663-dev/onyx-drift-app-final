import React, { useEffect, useRef, useState, Suspense, lazy, useCallback } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
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

// Lazy Loaded Pages
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
const GlobalVoiceAssistant = ({ onCommand }) => {
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

    if (isListening) recognitionRef.current.start();
    else recognitionRef.current.stop();

    return () => recognitionRef.current?.stop();
  }, [isListening, onCommand]);

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
};

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
    } catch (err) {
      console.error("Action Execution Failed:", err);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const startOnyxPipeline = async () => {
      try {
        // ১. সিকিউরিটি এবং প্রাইভেসি
        await PrivacyVault.initializeVault();
        const access = await OnyxGatekeeper.verifySession(user);
        if (access !== "AUTHORIZED") return;

        // ২. ক্যামেরা স্ট্রিম
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: 30 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // ৩. ইঞ্জিন ইনিশিয়ালাইজেশন
        await OnyxEngine.init((type, results) => {
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

        // ৪. রেন্ডার লুপ
        const processFrame = async () => {
          if (videoRef.current?.readyState === 4) {
            await OnyxEngine.process(videoRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(processFrame);
        };
        processFrame();

      } catch (err) {
        console.error("Neural OS Initialization Failed:", err);
      }
    };

    startOnyxPipeline();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAuthenticated, user, handleNeuralCommand]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono">INITIALIZING_ONYX_CORE...</div>;

  const isFullWidthPage = ["/messenger", "/messages", "/settings", "/", "/join", "/reels", "/ai-twin", "/call"].some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 overflow-x-hidden">
      <Toaster position="top-center" />
      <CustomCursor />
      
      {/* 🧠 Neural Vision Pipeline - Background Processing */}
      
      <video 
        ref={videoRef} 
        className="fixed opacity-0 pointer-events-none" 
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
              <Route path="/" element={isAuthenticated ? <Navigate to="/feed" /> : <Landing />} />
              <Route path="/join" element={<JoinPage />} /> 
              <Route path="/feed" element={<ProtectedRoute component={PremiumHomeFeed} />} />
              <Route path="/reels" element={<ProtectedRoute component={ReelsFeed} />} />
              <Route path="/profile/:userId" element={<ProtectedRoute component={ProfilePage} />} />
              <Route path="/messages/:userId?" element={<ProtectedRoute component={Messenger} />} />
              <Route path="/settings" element={<ProtectedRoute component={Settings} />} />
              <Route path="/call/:roomId" element={<ProtectedRoute component={CallPage} />} />
              <Route path="/ai-twin" element={<ProtectedRoute component={AITwinSync} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ component: Component }) => {
  const AuthenticatedComponent = withAuthenticationRequired(Component, {
    onRedirecting: () => <div className="h-screen bg-[#020617]" />
  });
  return <AuthenticatedComponent />;
};