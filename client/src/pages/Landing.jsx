import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SignUp from "../components/Auth/SignUp"; // আপনার সাইনআপ কম্পোনেন্ট ইমপোর্ট

const Landing = () => {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState("INITIALIZE NEURAL LINK");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false); // মডাল কন্ট্রোল করার জন্য স্টেট
  
  const glitchText = {
    initial: { skewX: 0 },
    animate: {
      skewX: [0, -2, 2, 0],
      transition: { duration: 0.2, repeat: Infinity, repeatType: "mirror" },
    },
  };

  const handleNeuralLogin = async () => {
    setIsProcessing(true);
    setAuthStatus("CALIBRATING GATEWAY...");

    // সাইনআপ মডাল ওপেন করার জন্য সামান্য ডিলে
    setTimeout(() => {
      setAuthStatus("INITIALIZE NEURAL LINK");
      setIsProcessing(false);
      setShowSignUp(true); // মডাল ওপেন হবে
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center overflow-hidden relative">
      
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

      <section className="relative z-30 flex flex-col items-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            variants={glitchText} 
            initial="initial" 
            animate="animate" 
            className="text-7xl md:text-9xl font-black text-white mb-4 italic uppercase tracking-tighter"
          >
            ONYX<span className="text-cyan-500">DRIFT</span>
          </motion.h1>
          
          <p className="text-cyan-400/50 font-mono mb-12 tracking-[0.4em] uppercase text-[10px] md:text-xs">
            Authorized Personnel Only // Neural ID Required
          </p>
        </motion.div>

        {/* Login/Signup Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNeuralLogin}
          disabled={isProcessing}
          className={`group relative px-12 py-6 bg-transparent rounded-full border border-cyan-500/30 text-white font-mono font-bold text-lg transition-all duration-500 ${
            isProcessing 
            ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.4)]' 
            : 'hover:border-cyan-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]'
          }`}
        >
          <span className="relative z-10 flex items-center gap-3">
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {authStatus}
          </span>
          <div className="absolute inset-0 bg-cyan-500/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
        </motion.button>

        {/* System Info */}
        <div className="mt-12 opacity-30 flex flex-col items-center">
          <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4" />
          <p className="text-[9px] font-mono text-cyan-500 tracking-widest uppercase">
            Database: Supabase // Status: Active
          </p>
        </div>
      </section>

      {/* SignUp Modal Overlay */}
      <AnimatePresence>
        {showSignUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#020617] border border-cyan-500/30 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <SignUp onClose={() => setShowSignUp(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-8 w-full text-center">
        <p className="text-[9px] text-zinc-700 font-mono uppercase tracking-[0.5em]">
          Connection Status: <span className="text-green-500 animate-pulse font-bold">Encrypted</span>
        </p>
      </footer>
    </div>
  );
};

export default Landing;