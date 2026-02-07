// components/RecoveryPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUnlockAlt, FaUserShield, FaRadiation, FaSkull } from 'react-icons/fa';

const RecoveryPage = () => {
  const [key, setKey] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleRecovery = () => {
    if (!key.startsWith("ONYX-DRFT-")) {
      alert("Invalid Quantum Key Format.");
      return;
    }
    
    setIsVerifying(true);
    
    // সিমিউলেটেড সার্ভার চেক (২ সেকেন্ড পর আনলক হবে)
    setTimeout(() => {
      setIsVerifying(false);
      setIsUnlocked(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 font-sans">
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full max-w-md bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] shadow-2xl backdrop-blur-xl text-center"
          >
            <div className="mb-8 relative">
              <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full mx-auto flex items-center justify-center">
                <FaUnlockAlt className="text-rose-500 text-2xl animate-pulse" />
              </div>
              <div className="absolute top-0 right-1/3 w-3 h-3 bg-rose-500 rounded-full blur-[4px] animate-ping" />
            </div>

            <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white mb-2">Legacy Access</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-8 leading-relaxed">
              Enter the Quantum Recovery Key provided by the original node owner to initiate the Afterlife Resonance.
            </p>

            <div className="space-y-4">
              <input 
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="ONYX-DRFT-XXXXXX"
                className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-center font-mono text-rose-500 tracking-widest outline-none focus:border-rose-500/50 transition-all"
              />

              <button 
                onClick={handleRecovery}
                disabled={isVerifying || !key}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Bypassing Encryption...
                  </>
                ) : (
                  "Initiate Resonance"
                )}
              </button>
            </div>
            
            <p className="mt-8 text-[8px] text-zinc-700 uppercase font-mono tracking-tighter">
              Bypassing this protocol without authorization is a violation of the Neural Privacy Act.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-6">
                <FaUserShield className="text-cyan-500 text-6xl mx-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Neural Seal Broken</h2>
            <p className="text-cyan-400 font-mono text-sm mb-10 tracking-widest">Welcome back. The AI Twin is waiting for you.</p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-4 bg-white text-black font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-white/10"
              onClick={() => window.location.href = '/inheritor-dashboard'}
            >
              Enter Dashboard
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecoveryPage;