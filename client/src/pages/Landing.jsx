import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth0 } from "@auth0/auth0-react"; // Auth0 হুক ইমপোর্ট

const Landing = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  
  // Auth0 হুক থেকে লগইন ফাংশন নেওয়া
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen w-full bg-black flex flex-col md:flex-row items-center justify-center overflow-hidden">
      
      {/* বাম পাশের লোগো অংশ */}
      <div className="flex-1 flex flex-col items-center justify-center p-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-[180px] md:text-[300px] font-black italic tracking-tighter leading-none text-white select-none"
          >
            OX<span className="text-cyan-500">.</span>
          </motion.div>
          <p className="text-zinc-700 font-mono tracking-[1.5em] text-xs md:text-sm uppercase -mt-4 md:-mt-8">
            ONYXDRIFT // NEURAL_LINK
          </p>
      </div>

      {/* ডান পাশের লগইন/সাইনআপ অংশ */}
      <div className="flex-1 flex flex-col items-center md:items-start p-10 z-10">
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-[500px]">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-12 tracking-tight leading-none">Happening now</h1>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-10">Join today.</h2>
          
          <div className="flex flex-col gap-6 w-full max-w-[320px]">
            {/* Auth0 ব্যবহার করে সরাসরি সাইনআপ/লগইন */}
            <button 
              onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })} 
              className="w-full py-4 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-lg"
            >
              Create account
            </button>
            
            <div className="pt-8">
               <p className="text-white font-bold text-lg mb-4">Already have an account?</p>
               <button 
                onClick={() => loginWithRedirect()} 
                className="w-full py-4 bg-black border border-zinc-800 text-cyan-500 font-bold rounded-full hover:bg-zinc-900 transition-all text-lg"
               >
                 Sign in
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;