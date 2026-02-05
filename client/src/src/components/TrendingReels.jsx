import React from "react";
import { motion } from "framer-motion";
import { FaPlay, FaFire } from "react-icons/fa";

const TrendingReels = ({ reels }) => {
  return (
    <div className="hidden lg:block w-80 sticky top-24 h-fit space-y-6">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-500/20 rounded-xl text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <FaFire size={18} />
          </div>
          <h3 className="font-black text-white italic text-sm tracking-widest uppercase">
            Trending Drifts
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {reels?.map((reel, index) => (
            <motion.div
              key={reel._id}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group border border-white/5"
            >
              <video 
                src={reel.media} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                muted
                onMouseOver={(e) => e.target.play()}
                onMouseOut={(e) => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 flex items-center gap-1">
                <FaPlay size={8} className="text-cyan-400" />
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                  {(reel.views / 1000).toFixed(1)}K
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all">
          View All Neural Drifts
        </button>
      </div>
    </div>
  );
};

export default TrendingReels;