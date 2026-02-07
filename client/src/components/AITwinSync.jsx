import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaSync, FaShieldAlt, FaSkull, FaMicrochip, FaBolt } from 'react-icons/fa';
import axios from 'axios';
import { useAuth0 } from "@auth0/auth0-react";
import NeuralModel from './NeuralModel';
const AITwinSync = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [syncData, setSyncData] = useState({ syncLevel: 0, traits: [] });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // এখানে আপনার ব্যাকএন্ড থেকে ডেটা ফেচ হবে
    setSyncData({ syncLevel: 68, traits: ['Visionary', 'Minimalist', 'Strategic'] });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-20 font-mono">
      {/* হেডার */}
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }}>
          <FaBrain className="text-purple-500 text-6xl mx-auto mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
        </motion.div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">AI Twin <span className="text-purple-500">Synchronizer</span></h1>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-[0.3em]">Building your digital immortality</p>
      </div>
      <div className="md:col-span-2 flex flex-col items-center justify-center bg-zinc-900/10 rounded-[40px] border border-white/5 py-10 mb-6">
    <NeuralModel />
    <p className="text-[10px] text-purple-500 font-mono animate-pulse uppercase tracking-[0.4em]">Neural Core: Manifesting...</p>
</div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sync Progress Card */}
        <div className="bg-zinc-900/30 border border-purple-500/20 p-8 rounded-[32px] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><FaSync className="text-4xl animate-spin-slow" /></div>
          <h3 className="text-purple-400 font-black text-xs uppercase mb-6 tracking-widest">Neural Sync Progress</h3>
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
              <motion.circle 
                cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={440} strokeDashoffset={440 - (440 * syncData.syncLevel) / 100}
                className="text-purple-500 shadow-[0_0_20px_#a855f7]"
            
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{syncData.syncLevel}%</span>
              <span className="text-[8px] text-zinc-500">SYNCED</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSyncing(true)}
            className="w-full py-4 bg-purple-600/20 border border-purple-500/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all"
          >
            {isSyncing ? "CALIBRATING..." : "Initiate Manual Sync"}
          </button>
        </div>

        {/* Personality Traits */}
        <div className="bg-zinc-900/30 border border-cyan-500/20 p-8 rounded-[32px] backdrop-blur-xl">
          <h3 className="text-cyan-400 font-black text-xs uppercase mb-6 tracking-widest">Digital Personality DNA</h3>
          <div className="space-y-4">
            {syncData.traits.map((trait, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-300 font-bold uppercase">{trait}</span>
                <FaBolt className="text-yellow-500 text-[10px]" />
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
            <p className="text-[9px] text-zinc-500 leading-relaxed italic">
              "Your AI Twin is currently mimicking your speech patterns with 89% accuracy."
            </p>
          </div>
        </div>

        {/* Legacy Mode Toggle */}
        <div className="md:col-span-2 bg-zinc-900/30 border border-rose-500/20 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-rose-500/10 rounded-3xl text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <FaSkull size={30} />
            </div>
            <div>
              <h3 className="text-rose-500 font-black text-sm uppercase tracking-tighter">Legacy Protocol (Digital Immortality)</h3>
              <p className="text-zinc-500 text-[10px] mt-1 max-w-sm">If your neural link remains inactive for 90 days, your AI Twin will take full control of your digital existence.</p>
            </div>
          </div>
          <button className="px-10 py-4 bg-rose-500 text-black font-black text-xs uppercase rounded-2xl shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform">
            Activate Death Switch
          </button>
        </div>

      </div>
    </div>
  );
};

export default AITwinSync;