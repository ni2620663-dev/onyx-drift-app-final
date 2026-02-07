// components/LegacySetup.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaLock, FaHourglassHalf, FaFingerprint, 
  FaSkullCrossbones, FaKey, FaShareAlt, FaCopy, FaCheckCircle 
} from 'react-icons/fa';

const LegacySetup = () => {
  const [isSealed, setIsSealed] = useState(false);
  const [inactivityLimit, setInactivityLimit] = useState(12);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // অস্তিত্ব সিল করার সময় কি জেনারেট করা
  const handleSealExistence = () => {
    const randomHash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const key = `ONYX-DRFT-${randomHash}`;
    setRecoveryKey(key);
    setIsSealed(true);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-[#050505] border border-cyan-500/20 p-8 rounded-[40px] shadow-[0_0_50px_rgba(6,182,212,0.1)] relative overflow-hidden max-w-md mx-auto">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
          <FaHourglassHalf className={`text-cyan-500 ${!isSealed ? 'animate-spin-slow' : ''}`} />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">Century Vault</h2>
          <p className="text-[9px] text-cyan-500/70 font-mono uppercase mt-0.5">
            Status: {isSealed ? 'NEURAL SEALED' : 'AWAITING AUTHENTICATION'}
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {/* Inheritor ID Input */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all">
          <p className="text-[10px] text-gray-500 mb-2 uppercase font-black tracking-widest">Inheritor Neural ID</p>
          <input 
            disabled={isSealed}
            className="bg-transparent w-full text-cyan-400 outline-none font-mono text-sm placeholder:text-zinc-800" 
            placeholder="NX-789-ALPHA-TRANSFER..." 
          />
        </div>
        
        {/* Death-Switch Logic */}
        <div className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 relative overflow-hidden">
          {isSealed && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10" />}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FaSkullCrossbones className="text-rose-500 text-xs animate-pulse" />
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-tighter">
                Neural Death-Switch
              </p>
            </div>
            <span className="text-cyan-500 font-mono font-bold text-sm">
              {inactivityLimit} MONTHS
            </span>
          </div>
          
          <input 
            type="range" min="1" max="24" 
            disabled={isSealed}
            value={inactivityLimit} 
            onChange={(e) => setInactivityLimit(e.target.value)}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-3"
          />
          <p className="text-[8px] text-zinc-600 uppercase leading-relaxed font-mono">
            Trigger: If inactive for {inactivityLimit} months, AI Twin & Vault will bypass encryption for the inheritor.
          </p>
        </div>

        {/* Dynamic Key Display (Only shows after Sealing) */}
        <AnimatePresence>
          {isSealed && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl border-dashed"
            >
              <div className="flex items-center gap-2 mb-3">
                <FaKey className="text-purple-400 text-[10px]" />
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Access Key Generated</p>
              </div>
              <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-white/5 mb-3">
                <code className="text-white font-mono text-xs">{recoveryKey}</code>
                <button onClick={copyKey} className="text-zinc-500 hover:text-white">
                  {isCopied ? <FaCheckCircle className="text-green-500" /> : <FaCopy />}
                </button>
              </div>
              <button className="w-full py-2 bg-purple-500 text-white text-[9px] font-black uppercase rounded-lg flex items-center justify-center gap-2">
                <FaShareAlt /> Share with Inheritor
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Action Button */}
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={handleSealExistence}
        disabled={isSealed}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
          isSealed 
          ? "bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed" 
          : "bg-cyan-500 text-black shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02]"
        }`}
      >
        {isSealed ? <FaLock size={16} /> : <FaFingerprint size={20} className="animate-pulse" />}
        {isSealed ? "Vault Sealed Permanently" : "Seal My Existence"}
      </motion.button>
      
      <p className="mt-6 text-[8px] text-zinc-700 text-center uppercase tracking-[0.2em] leading-relaxed font-mono">
        Manual override impossible for 100 terrestrial years. <br/>
        ONYXDRIFT MESH NETWORK © 2026
      </p>
    </div>
  );
};

export default LegacySetup;