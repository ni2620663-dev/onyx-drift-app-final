import React, { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";

// 🧠 Your New Core Services
import OnyxBridge from "../core/OnyxBridge";
import OnyxGatekeeper from "../core/OnyxGatekeeper";
import OnyxVoice from "../core/OnyxVoice";

const Landing = () => {
  const { loginWithRedirect } = useAuth0();
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const [authStatus, setAuthStatus] = useState("INITIALIZE NEURAL LINK");
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      // ১. ক্যামেরা এবং অডিও পারমিশন
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 480, height: 360 },
        audio: true 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // ক্যানভাস সেটআপ (পিক্সেল এনালাইসিসের জন্য)
      canvasRef.current.width = 480;
      canvasRef.current.height = 360;
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });

      // ২. নতুন OnyxBridge এক্টিভেট করা
      OnyxBridge.activate(videoRef.current, ctx, (action) => {
        // যদি সেন্সর কোনো মুভমেন্ট বা ইনটেন্ট ডিটেক্ট করে
        if (action.type === 'USER_INTENT_DETECTED') {
          finalizeAuth();
        }
      });

      // ৩. ভয়েস কমান্ড ট্র্যাকিং (বিকল্প আনলক পদ্ধতি)
      await OnyxVoice.init();
      setAuthStatus("LISTENING FOR 'ONYX UNLOCK'...");

      // সিম্পল ভয়েস কীওয়ার্ড চেক
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          if (transcript.includes("onyx unlock") || transcript.includes("unlock")) {
            finalizeAuth();
          }
        };
        recognition.start();
      }

    } catch (err) {
      console.error("Neural Link Failed:", err);
      setAuthStatus("LINK FAILED: PERMISSION DENIED");
      setIsProcessing(false);
    }
  };

  const finalizeAuth = () => {
    setAuthStatus("ACCESS GRANTED. REDIRECTING...");
    OnyxBridge.stop();
    // ১ সেকেন্ড ওয়েট করে রিডাইরেক্ট (স্মুথ ফিলিং এর জন্য)
    setTimeout(() => {
      loginWithRedirect();
    }, 1000);
  };

  // ক্লিনআপ
  useEffect(() => {
    return () => {
      OnyxBridge.stop();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center overflow-hidden">
      {/* ইনভিজিবল সেন্সর ভিডিও */}
      <video ref={videoRef} className="hidden" playsInline muted />
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

      <section className="relative z-30 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <motion.h1 
          variants={glitchText} 
          initial="initial" 
          animate="animate" 
          className="text-7xl md:text-9xl font-black text-white mb-6 italic uppercase tracking-tighter"
        >
          ONYX<span className="text-cyan-500">DRIFT</span>
        </motion.h1>
        
        <p className="text-cyan-500/60 font-mono mb-10 tracking-[0.3em] uppercase text-sm">
          Neural-Based Social Operating System
        </p>

        <button 
          onClick={startNeuralAuth}
          disabled={isProcessing}
          className={`group relative px-10 py-5 bg-transparent rounded-full border border-cyan-500/30 text-white font-black text-xl overflow-hidden transition-all duration-500 ${isProcessing ? 'border-cyan-500 shadow-[0_0_30px_#06b6d4]' : 'hover:border-cyan-500 hover:shadow-[0_0_20px_#06b6d4]'}`}
        >
          <span className="relative z-10">{authStatus}</span>
          <div className="absolute inset-0 bg-cyan-500/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
        </button>

        {isProcessing && (
          <div className="mt-8 flex gap-2">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          </div>
        )}
      </section>
    </div>
  );
};

export default Landing;