import React, { useState } from 'react';
import { ShieldCheck, Fingerprint, MapPin, RefreshCw, EyeOff, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const SecuritySettings = () => {
  const [ghostMode, setGhostMode] = useState(false);
  const [aiRotation, setAiRotation] = useState(true);

  return (
    <div className="space-y-6">
      {/* ১. নিউরাল শিল্ড স্ট্যাটাস (Visual Highlight) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-900/40 to-purple-900/40 p-6 rounded-[32px] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Neural Shield Active</h2>
            <p className="text-cyan-400 text-xs font-bold tracking-widest">ENCRYPTION: AES-256-GCM</p>
          </div>
          <ShieldCheck size={48} className="text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]" />
        </div>
        {/* এনিমেটেড ব্যাকগ্রাউন্ড গ্রিড */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* ২. ডিভাইস ট্র্যাকিং সেকশন (Heartbeat) */}
      <div className="bg-[#111111] rounded-[32px] p-6 border border-white/5">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Active Nodes (Devices)</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
            <Smartphone className="text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">iPhone 15 Pro (Current)</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <MapPin size={10} /> <span>Dhaka, Bangladesh</span>
              </div>
            </div>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* ৩. ইউনিক সিকিউরিটি ফিচারস (Ghost & AI Rotation) */}
      <div className="bg-[#111111] rounded-[32px] overflow-hidden border border-white/5">
        
        {/* Ghost Mode */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-400"><EyeOff size={22}/></div>
            <div>
              <h3 className="font-bold text-white text-sm italic">Ghost Mode</h3>
              <p className="text-gray-500 text-[10px]">Profile invisible to neural searches & anti-screenshot.</p>
            </div>
          </div>
          <CustomSwitch active={ghostMode} toggle={() => setGhostMode(!ghostMode)} color="bg-red-500" />
        </div>

        {/* AI Key Rotation */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400"><RefreshCw size={22}/></div>
            <div>
              <h3 className="font-bold text-white text-sm italic">AI-Key Rotation</h3>
              <p className="text-gray-500 text-[10px]">Automatically rotates session keys every 24h.</p>
            </div>
          </div>
          <CustomSwitch active={aiRotation} toggle={() => setAiRotation(!aiRotation)} color="bg-cyan-500" />
        </div>

      </div>

      {/* ৪. বায়োমেট্রিক অথেন্টিকেশন */}
      <button className="w-full p-5 bg-white/5 border border-white/10 rounded-[24px] flex items-center justify-center gap-3 group hover:bg-cyan-500/10 transition-all">
        <Fingerprint className="text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-black uppercase tracking-widest text-white">Setup Neural ID</span>
      </button>
    </div>
  );
};

// কাস্টম সুইচ কম্পোনেন্ট
const CustomSwitch = ({ active, toggle, color }) => (
  <div onClick={toggle} className={`w-14 h-7 rounded-full p-1 transition-all cursor-pointer ${active ? color : 'bg-gray-800'}`}>
    <motion.div 
      animate={{ x: active ? 28 : 0 }}
      className="w-5 h-5 bg-white rounded-full shadow-lg"
    />
  </div>
);

export default SecuritySettings;