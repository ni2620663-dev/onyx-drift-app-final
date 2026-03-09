import React, { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";
import OnyxEngine from "../core/OnyxEngine";
import OnyxGatekeeper from "../core/OnyxGatekeeper";

const Landing = () => {
  const { loginWithRedirect } = useAuth0();
  const videoRef = useRef(null);
  const [authStatus, setAuthStatus] = useState("INITIALIZE NEURAL LINK");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cleanup এর জন্য রেফারেন্স
  const authInterval = useRef(null);
  const recognitionRef = useRef(null);

  const glitchText = {
    initial: { skewX: 0 },
    animate: {
      skewX: [0, -2, 2, 0],
      transition: { duration: 0.2, repeat: Infinity, repeatType: "mirror" },
    },
  };

  const startNeuralAuth = async () => {
    setIsProcessing(true);
    setAuthStatus("CALIBRATING NEURAL CORE...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await OnyxEngine.init();

      // ভয়েস লিসেনার
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.onstart = () => setAuthStatus("LISTENING FOR VOICE KEY...");
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          if (transcript.includes("onyx unlock")) {
            cleanupAuth();
            finalizeAuth();
          }
        };
        recognitionRef.current.start();
      }

      // নিউরাল ও হ্যান্ড ট্র্যাকিং লুপ
      authInterval.current = setInterval(async () => {
        if (window.onyxData?.faces?.length > 0 && window.onyxData?.hands?.length > 0) {
          const isFocused = OnyxGatekeeper.verifyNeuralFocus(window.onyxData.faces[0]);
          const isHandActive = window.onyxData.hands[0]?.keypoints?.length > 0;

          if (isFocused && isHandActive) {
            cleanupAuth();
            finalizeAuth();
          }
        }
      }, 500);
    } catch (err) {
      setAuthStatus("LINK FAILED: PERMISSION DENIED");
      setIsProcessing(false);
    }
  };

  const cleanupAuth = () => {
    if (authInterval.current) clearInterval(authInterval.current);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const finalizeAuth = () => {
    setAuthStatus("ACCESS GRANTED. REDIRECTING...");
    loginWithRedirect();
  };

  // কম্পোনেন্ট আনমাউন্ট হলে সব ক্লিনআপ
  useEffect(() => () => cleanupAuth(), []);

  return (
    <div className="min-h-screen w-full bg-black relative overflow-x-hidden flex flex-col items-center">
      <video ref={videoRef} autoPlay playsInline className="hidden" />

      {/* 🎥 Background Video */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-10" /> 
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30">
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-and-data-4430-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Hero Section */}
      <section className="relative z-30 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <motion.h1 variants={glitchText} initial="initial" animate="animate" className="text-7xl md:text-9xl font-black text-white mb-6 italic uppercase">
          ONYX<span className="text-cyan-500">DRIFT</span>
        </motion.h1>

        <div className="relative group max-w-md mx-auto">
          <button 
            onClick={startNeuralAuth}
            disabled={isProcessing}
            className={`relative w-full px-10 py-5 bg-black rounded-full border border-cyan-500/30 text-white font-black text-xl transition-all ${isProcessing ? 'opacity-50' : 'hover:bg-cyan-500 hover:text-black'}`}
          >
            {authStatus}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Landing;