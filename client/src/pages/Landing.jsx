import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios"; 

// --- Custom Auth Component ---
const AuthModal = ({ mode, onClose, onSwitch }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    email: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`http://localhost:10000${endpoint}`, formData, {
        withCredentials: true 
      });

      if (response.status === 200 || response.status === 201) {
        window.location.href = "/feed"; 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full text-white">
      <div className="flex justify-between items-start mb-10">
        <div className="flex flex-col">
           <span className="text-5xl font-black italic tracking-tighter leading-none">
            OX<span className="text-cyan-500">.</span>
           </span>
           <span className="text-[8px] font-bold text-zinc-600 tracking-[0.5em] uppercase mt-1">OnyxDrift</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-all text-xl outline-none">✕</button>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-extrabold mb-10 tracking-tight leading-tight">
        {mode === 'login' ? 'Drift into Onyx.' : 'Join the Neural Network.'}
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-6 text-center">
          <p className="text-red-500 font-mono text-[11px] uppercase tracking-wider">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <>
            <input 
              type="text" 
              placeholder="Full Name" 
              required
              className="w-full bg-black border border-zinc-800 p-4 rounded-xl focus:border-cyan-500 outline-none transition-all text-lg"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              className="w-full bg-black border border-zinc-800 p-4 rounded-xl focus:border-cyan-500 outline-none transition-all text-lg"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </>
        )}
        <input 
          type="text" 
          placeholder="Username or ID" 
          required
          className="w-full bg-black border border-zinc-800 p-4 rounded-xl focus:border-cyan-500 outline-none transition-all text-lg"
          onChange={(e) => setFormData({...formData, username: e.target.value})}
        />
        <input 
          type="password" 
          placeholder="Password" 
          required
          className="w-full bg-black border border-zinc-800 p-4 rounded-xl focus:border-cyan-500 outline-none transition-all text-lg"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-white text-black font-bold py-4 rounded-full mt-6 hover:bg-cyan-500 hover:text-white transition-all duration-300 disabled:opacity-50 text-lg"
        >
          {loading ? "SYNCING..." : (mode === 'login' ? 'Log in' : 'Create Account')}
        </button>
      </form>

      <div className="mt-12 pt-8 border-t border-zinc-900">
        <p className="text-zinc-500 text-base">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button 
          onClick={onSwitch} 
          className="text-cyan-500 cursor-pointer hover:underline font-bold text-lg mt-2 block outline-none"
        >
          {mode === 'login' ? 'Sign up for OnyxDrift' : 'Log in to your account'}
        </button>
      </div>
    </div>
  );
};

const Landing = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // সোশ্যাল লগইন হ্যান্ডলার ফাংশন
  const handleSocialLogin = (provider) => {
    // এটি ইউজারকে সরাসরি আপনার ব্যাকএন্ডের সোশ্যাল লগইন রাউটে পাঠিয়ে দেবে
  window.location.href = `http://localhost:10000/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col md:flex-row items-center justify-center overflow-hidden">
      
      {/* Left Side: Big Logo */}
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

      {/* Right Side: Welcome Text */}
      <div className="flex-1 flex flex-col items-center md:items-start p-10 z-10">
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="max-w-[500px]"
        >
          <h1 className="text-6xl md:text-8xl font-black text-white mb-12 tracking-tight leading-none">
            Happening now
          </h1>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-10">
            Join today.
          </h2>

          <div className="flex flex-col gap-4 w-full max-w-[320px]">
            {/* Google Button */}
            <button 
              onClick={() => handleSocialLogin('google')}
              className="w-full py-3 bg-white text-black font-bold rounded-full flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all"
            >
               <img src="https://www.gstatic.com" className="w-5" alt="G" />
               Sign up with Google
            </button>

            {/* Facebook Button */}
            <button 
              onClick={() => handleSocialLogin('facebook')}
              className="w-full py-3 bg-[#1877F2] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:opacity-90 transition-all"
            >
               <svg fill="currentColor" viewBox="0 0 24 24" className="w-5">
                 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
               </svg>
               Sign up with Facebook
            </button>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-[1px] bg-zinc-900"></div>
              <span className="text-zinc-600 text-sm font-mono">OR</span>
              <div className="flex-1 h-[1px] bg-zinc-900"></div>
            </div>

            <button 
              onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
              className="w-full py-3 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Create account
            </button>

            <div className="mt-12">
               <p className="text-white font-bold text-lg mb-4">Already have an account?</p>
               <button 
                onClick={() => { setAuthMode("login"); setShowAuth(true); }}
                className="w-full py-3 bg-black border border-zinc-800 text-cyan-500 font-bold rounded-full hover:bg-zinc-900 transition-all"
               >
                 Sign in
               </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/95 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-black border border-zinc-800 p-8 md:p-12 rounded-[2rem] w-full max-w-[550px] shadow-[0_0_80px_rgba(6,182,212,0.15)] relative overflow-y-auto max-h-[90vh]"
            >
              <AuthModal 
                mode={authMode} 
                onClose={() => setShowAuth(false)} 
                onSwitch={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
