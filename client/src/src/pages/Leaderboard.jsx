import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCrown, FaBolt } from 'react-icons/fa';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      const res = await axios.get(`${API_URL}/api/user/leaderboard`);
      setLeaders(res.data);
    };
    fetchLeaders();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/10">
      <h2 className="text-2xl font-black italic uppercase text-cyan-400 mb-8 tracking-tighter">Neural Rankings</h2>
      <div className="space-y-4">
        {leaders.map((user, index) => (
          <div key={user._id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${index === 0 ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-white/5 border-white/5'}`}>
            <div className="flex items-center gap-4">
              <span className="text-zinc-600 font-black italic text-xl">#{index + 1}</span>
              <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-black text-white uppercase flex items-center gap-2">
                  {user.name} {user.unlockedAssets?.includes('genesis_badge') && <FaCrown className="text-cyan-400" size={12} />}
                </p>
                <p className="text-[8px] text-zinc-500 font-bold uppercase">{user.neuralRank || 'Drifter'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-cyan-400 flex items-center gap-2 italic">
                {user.neuralImpact} <FaBolt size={10} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};