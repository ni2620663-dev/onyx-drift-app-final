import React from 'react';
import { motion } from 'framer-motion';
import { FaGem, FaBolt, FaCrown, FaFire, FaGhost, FaSnowflake } from 'react-icons/fa';
import toast from 'react-hot-toast';

const NeuralForge = ({ userImpact, onPurchase }) => {
  const shopItems = [
    {
      id: 'solar_flare',
      name: "Solar Flare Aura",
      desc: "A burning orange glow for your avatar.",
      cost: 500,
      icon: <FaFire className="text-orange-500" />,
      type: "aura"
    },
    {
      id: 'void_ghost',
      name: "Void Ghost",
      desc: "Glitchy purple effect that screams mystery.",
      cost: 1200,
      icon: <FaGhost className="text-purple-500" />,
      type: "aura"
    },
    {
      id: 'truth_anchor',
      name: "Truth Anchor Badge",
      desc: "Verified badge for 95%+ trust score holders.",
      cost: 2000,
      icon: <FaCrown className="text-yellow-400" />,
      type: "badge"
    },
    {
      id: 'ice_pulse',
      name: "Cryo Pulse",
      desc: "Slow, cold blue breathing animation.",
      cost: 800,
      icon: <FaSnowflake className="text-cyan-400" />,
      type: "aura"
    }
  ];

  const handleBuy = (item) => {
    if (userImpact < item.cost) {
      toast.error("Insufficient Impact Points! Complete more missions.");
      return;
    }
    // Call the purchase function from props
    onPurchase(item);
  };

  return (
    <div className="p-2">
      <div className="mb-8">
        <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter flex items-center gap-3">
          <FaGem className="text-pink-500 animate-pulse" /> Neural Forge
        </h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
          Spend Impact Points to evolve your digital presence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shopItems.map((item) => (
          <motion.div 
            key={item.id}
            whileHover={{ y: -5 }}
            className="bg-zinc-900/40 border border-white/5 p-5 rounded-[30px] backdrop-blur-md flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                {item.icon}
              </div>
              <div className="flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20">
                <FaBolt className="text-cyan-400 text-[10px]" />
                <span className="text-[10px] font-black text-white">{item.cost}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">{item.name}</h3>
              <p className="text-[9px] text-zinc-500 font-bold mt-1 leading-tight italic">{item.desc}</p>
            </div>

            <button 
              onClick={() => handleBuy(item)}
              className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-cyan-400 transition-all"
            >
              Forge Asset
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-transparent rounded-[30px] border border-purple-500/10">
        <p className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.2em]">Current Balance</p>
        <p className="text-2xl font-black text-white italic">{userImpact} <span className="text-xs font-normal text-zinc-500 tracking-normal">Impact Pts</span></p>
      </div>
    </div>
  );
};

export default NeuralForge;