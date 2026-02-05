import React from "react";
import { motion } from "framer-motion";
import { 
  HiOutlineChartBar, 
  HiOutlineUsers, 
  HiOutlineHeart, 
  HiOutlineBolt, // সঠিক নাম
  HiOutlineSparkles, 
  HiArrowTrendingUp // HiOutlineTrendingUp এর বদলে এটি সঠিক
} from "react-icons/hi2";

const Analytics = () => {
  // আপনার tailwind.config.js অনুযায়ী ভেরিয়েবল ব্যবহার করা হয়েছে
  const glassPanel = "bg-zenith-card backdrop-blur-2xl border border-zenith-border shadow-glass-light rounded-[2.5rem]";
  
  const stats = [
    { id: 1, label: "Total Reach", value: "24.8K", growth: "+12%", icon: <HiOutlineUsers size={24}/>, color: "text-cyan-400" },
    { id: 2, label: "Engagement", value: "8.2%", growth: "+5.4%", icon: <HiOutlineHeart size={24}/>, color: "text-purple-400" },
    { id: 3, label: "AI Post Score", value: "92/100", growth: "Optimal", icon: <HiOutlineSparkles size={24}/>, color: "text-yellow-400" },
  ];

  return (
    <div className="w-full min-h-screen pb-20">
      <main className="max-w-[1000px] mx-auto py-8 px-4 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Zenith Insights</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">AI-Powered Social Performance Analytics</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-neon to-purple-neon rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-neon-blue"
          >
            Download Full Report
          </motion.button>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <motion.div 
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${glassPanel} p-6 flex items-center gap-6 group hover:bg-white/[0.08] transition-all`}
            >
              <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                <span className="text-[9px] font-bold text-cyan-neon/70">{stat.growth} this month</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Placeholder */}
          <div className={`${glassPanel} lg:col-span-2 p-8 min-h-[400px] relative overflow-hidden`}>
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <HiArrowTrendingUp className="text-cyan-neon" /> Engagement Flow
              </h4>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-neon"></span>
                <span className="w-3 h-3 rounded-full bg-purple-neon"></span>
              </div>
            </div>
            
            <div className="flex items-end justify-between h-48 gap-2">
              {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.1 }}
                  className="flex-1 bg-gradient-to-t from-cyan-neon/20 to-cyan-neon rounded-t-lg relative group"
                >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                   </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
            </div>
          </div>

          {/* AI Recommendation Panel */}
          <div className={`${glassPanel} p-8 flex flex-col justify-between border-cyan-neon/20`}>
            <div>
              <div className="w-12 h-12 bg-cyan-neon/10 rounded-2xl flex items-center justify-center mb-6">
                <HiOutlineBolt className="text-cyan-neon animate-pulse" size={24} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 italic">AI Recommendations</h4>
              <ul className="space-y-4">
                <li className="text-xs text-gray-400 leading-relaxed border-l-2 border-cyan-neon pl-4">
                  "Your audience is most active at <span className="text-white">9:00 PM</span>. Try posting a video then."
                </li>
                <li className="text-xs text-gray-400 leading-relaxed border-l-2 border-purple-neon pl-4">
                  "Use more <span className="text-white">#FutureTech</span> hashtags to increase reach by 15%."
                </li>
              </ul>
            </div>
            <button className="w-full mt-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all">
              Generate New Strategy
            </button>
          </div>
        </div>

        {/* Global Explorer Preview */}
        <div className={`${glassPanel} p-8`}>
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black uppercase tracking-widest">Trending in your network</h4>
              <button className="text-[10px] font-black uppercase tracking-widest text-cyan-neon hover:underline">See Explorer</button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="aspect-square rounded-3xl bg-white/5 border border-white/5 overflow-hidden group relative">
                  <img src={`https://picsum.photos/300/300?random=${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt=""/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                     <span className="text-[8px] font-black uppercase tracking-widest text-white">High Impact</span>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;