import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCrown, FaBolt } from 'react-icons/fa';

const Leaderboard = () => {
  const [topDrifters, setTopDrifters] = useState([]);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_URL}/api/user/leaderboard`).then(res => setTopDrifters(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] p-8 pt-24 text-white">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter text-cyan-400 mb-8">Top Drifters</h1>
      
      <div className="space-y-4 max-w-2xl">
        {topDrifters.map((drifter, index) => (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            key={drifter._id}
            className={`flex items-center justify-between p-6 rounded-2xl border ${index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/5 bg-white/5'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black italic text-zinc-700">#{index + 1}</span>
              <img src={drifter.avatar} className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30" alt="" />
              <div>
                <h3 className="font-bold uppercase tracking-widest text-sm">{drifter.name || drifter.nickname}</h3>
                <p className="text-[10px] text-cyan-500 font-black">RANK {drifter.neuralRank}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-black italic flex items-center gap-2">
                <FaBolt className="text-yellow-400 text-sm" /> {drifter.neuralImpact}
              </p>
              <p className="text-[8px] uppercase font-bold text-zinc-500 tracking-widest">Neural Impact</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;