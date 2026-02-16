import React from 'react';
import { Scissors, Wand2, Palette, Clock, TrendingUp, ShoppingBag, Zap, Sparkles } from "lucide-react";

const NavBtn = ({ icon: Icon, label, onClick, active }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group outline-none">
    <div className={`p-3 md:p-5 rounded-xl md:rounded-[1.8rem] transition-all duration-300 ${active ? 'bg-cyan-500 text-black shadow-lg scale-110' : 'bg-white/5 md:bg-zinc-900/50 text-zinc-600 hover:text-white'}`}>
      <Icon size={18} />
    </div>
    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tighter ${active ? 'text-cyan-500' : 'text-zinc-700'}`}>{label}</span>
  </button>
);

const Sidebar = ({ activeMenu, setActiveMenu, predictViralScore, editData, setEditData }) => {
  return (
    <aside className="hidden md:flex w-24 flex-col items-center py-8 gap-4 border-r border-white/5 bg-black/50 backdrop-blur-xl z-[100]">
      
      {/* Brand Logo */}
      <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-6 animate-pulse">
        <Zap size={28} className="text-black fill-black" />
      </div>

      {/* Main Tools */}
      <NavBtn 
        icon={Scissors} 
        label="Trim" 
        active={activeMenu === 'Trim'} 
        onClick={() => setActiveMenu('Trim')} 
      />
      
      <NavBtn 
        icon={Wand2} 
        label="Smart AI" 
        active={activeMenu === 'SmartAI'} 
        onClick={() => setActiveMenu('SmartAI')} 
      />
      
      <NavBtn 
        icon={Palette} 
        label="Color" 
        active={activeMenu === 'Color'} 
        onClick={() => setActiveMenu('Color')} 
      />
      
      <NavBtn 
        icon={Clock} 
        label="Speed" 
        active={activeMenu === 'Speed'} 
        onClick={() => setActiveMenu('Speed')} 
      />

      {/* AI Intelligence Tools */}
      <div className="w-10 h-px bg-white/5 my-2" />
      
      <button 
        onClick={predictViralScore}
        className="flex flex-col items-center gap-1 group outline-none hover:scale-110 transition-transform"
      >
        <div className="p-3 md:p-5 rounded-xl md:rounded-[1.8rem] bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 group-hover:border-purple-500 transition-all">
          <TrendingUp size={18} />
        </div>
        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter text-purple-400">Viral AI</span>
      </button>

      {/* Creator Marketplace Integration */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button 
          onClick={() => {
            setEditData(p => ({ ...p, shareToMarketplace: !p.shareToMarketplace }));
            // Optional: Marketplace toggle logic
          }} 
          className={`p-4 rounded-2xl transition-all duration-500 flex items-center justify-center ${
            editData.shareToMarketplace 
              ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] rotate-[360deg]' 
              : 'bg-white/5 text-zinc-600 hover:bg-white/10 hover:text-amber-500'
          }`}
          title="Share to Marketplace"
        >
          <ShoppingBag size={22} fill={editData.shareToMarketplace ? "black" : "none"} />
        </button>
        <span className={`text-[7px] font-black uppercase tracking-widest ${editData.shareToMarketplace ? 'text-amber-500' : 'text-zinc-800'}`}>
          {editData.shareToMarketplace ? "Listed" : "Market"}
        </span>
      </div>

    </aside>
  );
};

export default Sidebar;