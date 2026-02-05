import React from 'react';
import { motion } from 'framer-motion';
import { HiLightningBolt, HiFire, HiShieldCheck } from 'react-icons/hi';

const NeuralStats = ({ user }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Rank Card */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-black/60 border border-cyan-500/30 p-4 rounded-lg backdrop-blur-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-2 opacity-20"><HiLightningBolt size={40} className="text-cyan-400" /></div>
        <h3 className="text-cyan-400 text-xs uppercase tracking-widest mb-1">Neural Rank</h3>
        <p className="text-3xl font-black text-white italic">LVL {user?.neuralRank || 1}</p>
        <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full w-[65%] shadow-[0_0_10px_#22d3ee]"></div>
        </div>
      </motion.div>

      {/* Influence Card */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-black/60 border border-purple-500/30 p-4 rounded-lg backdrop-blur-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-2 opacity-20"><HiFire size={40} className="text-purple-400" /></div>
        <h3 className="text-purple-400 text-xs uppercase tracking-widest mb-1">Influence</h3>
        <p className="text-3xl font-black text-white italic">{user?.influence || 0}</p>
        <p className="text-[10px] text-purple-300/60 mt-2 uppercase tracking-tighter">Engagement across the drift</p>
      </motion.div>

      {/* Sync Rate Card */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-black/60 border border-lime-500/30 p-4 rounded-lg backdrop-blur-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-2 opacity-20"><HiShieldCheck size={40} className="text-lime-400" /></div>
        <h3 className="text-lime-400 text-xs uppercase tracking-widest mb-1">Sync Rate</h3>
        <p className="text-3xl font-black text-white italic">{user?.syncRate || 85}%</p>
        <p className="text-[10px] text-lime-300/60 mt-2 uppercase tracking-tighter">Neural stability confirmed</p>
      </motion.div>
    </div>
  );
};

export default NeuralStats;