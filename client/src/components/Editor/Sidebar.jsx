import React from 'react';
import { Scissors, Wand2, Palette, Clock, TrendingUp, ShoppingBag, Zap } from "lucide-react";

// Navigation Button Component with Mobile Optimization
const NavBtn = ({ icon: Icon, label, onClick, active }) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center gap-1 group outline-none active:scale-90 transition-transform"
  >
    <div className={`
      p-3 md:p-5 rounded-xl md:rounded-[1.8rem] transition-all duration-300 
      ${active 
        ? 'bg-cyan-500 text-black shadow-lg scale-110' 
        : 'bg-white/5 md:bg-zinc-900/50 text-zinc-500 hover:text-white'
      }
    `}>
      <Icon size={18} className="md:w-5 md:h-5" />
    </div>
    <span className={`
      text-[7px] md:text-[10px] font-black uppercase tracking-tighter 
      ${active ? 'text-cyan-500' : 'text-zinc-600'}
    `}>
      {label}
    </span>
  </button>
);

const Sidebar = ({ activeMenu, setActiveMenu, predictViralScore, editData, setEditData }) => {
  return (
    <>
      {/* Responsive Aside: 
        - Mobile: Fixed at bottom, Horizontal layout 
        - Desktop: Sidebar at left, Vertical layout 
      */}
      <aside className="
        fixed bottom-0 left-0 right-0 h-20 
        md:relative md:h-full md:w-24 
        flex flex-row md:flex-col items-center justify-around md:justify-start 
        py-2 md:py-8 gap-2 md:gap-4 
        border-t md:border-t-0 md:border-r border-white/5 
        bg-black/80 md:bg-black/50 backdrop-blur-2xl z-[500]
      ">
        
        {/* Brand Logo - Desktop Only */}
        <div className="hidden md:flex w-14 h-14 bg-cyan-500 rounded-2xl items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-6">
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

        {/* Separator - Desktop Only */}
        <div className="hidden md:block w-10 h-px bg-white/5 my-2" />
        
        {/* Viral AI Button */}
        <button 
          onClick={predictViralScore}
          className="flex flex-col items-center gap-1 group outline-none active:scale-90 transition-transform"
        >
          <div className="p-3 md:p-5 rounded-xl md:rounded-[1.8rem] bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/20">
            <TrendingUp size={18} />
          </div>
          <span className="text-[7px] md:text-[10px] font-black uppercase tracking-tighter text-purple-400">Viral</span>
        </button>

        {/* Marketplace Integration - Pushed to bottom on Desktop, Next to tools on Mobile */}
        <div className="md:mt-auto flex flex-col items-center gap-1">
          <button 
            onClick={() => {
              setEditData(p => ({ ...p, shareToMarketplace: !p.shareToMarketplace }));
            }} 
            className={`
              p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-500 flex items-center justify-center 
              ${editData.shareToMarketplace 
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] rotate-[360deg]' 
                : 'bg-white/5 text-zinc-600 hover:text-amber-500'
              }
            `}
          >
            <ShoppingBag size={20} fill={editData.shareToMarketplace ? "black" : "none"} />
          </button>
          <span className={`text-[7px] font-black uppercase tracking-widest hidden md:block ${editData.shareToMarketplace ? 'text-amber-500' : 'text-zinc-800'}`}>
            {editData.shareToMarketplace ? "Listed" : "Market"}
          </span>
        </div>

      </aside>

      {/* Spacer for Mobile (তা না হলে এডিট বার ভিডিওর কিছু অংশ ঢেকে ফেলবে) */}
      <div className="h-20 md:hidden" />
    </>
  );
};

export default Sidebar;