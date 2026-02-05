import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";
import { BRAND_NAME } from "../utils/constants";

const Landing = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center px-4"
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-4 italic">
          ONYX<span className="text-cyan-500">DRIFT</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed">
          Welcome to the next generation neural social network. 
          Connect, evolve, and drift through the digital void.
        </p>

        {/* Neural Login Bar */}
        <div className="relative group max-w-md mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          
          <button 
            onClick={() => loginWithRedirect()}
            className="relative w-full px-10 py-5 bg-[#020617] rounded-full border border-white/10 text-white font-bold text-xl flex items-center justify-center gap-3 hover:border-cyan-500/50 transition-all active:scale-95"
          >
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
            INITIALIZE NEURAL LINK
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-500 uppercase tracking-[0.3em]">
          Secure Authentication via Auth0
        </p>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
        <p className="text-[10px] font-mono text-cyan-400">STATUS: SYSTEM_READY // PORT: 10000</p>
      </div>
    </div>
  );
};

export default Landing;