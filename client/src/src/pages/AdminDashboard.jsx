import React, { useState } from 'react';
import { FaChartLine, FaCheck, FaTimes, FaWallet, FaBoxOpen, FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  // ডামি ডাটা (বাস্তবে এটি ডাটাবেজ থেকে আসবে)
  const [stats] = useState({
    totalIncome: "৪৫,২০০",
    activeAds: "১২৪",
    totalUsers: "১,৮৫০"
  });

  const [pendingAds, setPendingAds] = useState([
    { id: 1, name: "Razer Mouse", price: "৳৩২০০", user: "Siam12", img: "https://images.unsplash.com/photo-1527814732934-94a1e5d19599?w=400" },
    { id: 2, name: "Drift T-Shirt", price: "৳৪৫০", user: "Rahat_99", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" }
  ]);

  const approveAd = (id) => {
    setPendingAds(pendingAds.filter(ad => ad.id !== id));
    alert("Ad Approved and Live on Marketplace!");
  };

  return (
    <div className="p-6 bg-[#050505] min-h-screen text-white font-sans">
      <h1 className="text-3xl font-black italic tracking-tighter mb-8 flex items-center gap-3">
        <FaChartLine className="text-cyan-500" /> CONTROL CENTER
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[32px] shadow-xl">
          <FaWallet className="text-cyan-500 mb-2" size={24} />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Revenue</p>
          <h2 className="text-2xl font-black">৳{stats.totalIncome}</h2>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[32px] shadow-xl">
          <FaBoxOpen className="text-purple-500 mb-2" size={24} />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Active Listings</p>
          <h2 className="text-2xl font-black">{stats.activeAds}</h2>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[32px] shadow-xl">
          <FaUsers className="text-green-500 mb-2" size={24} />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Community Size</p>
          <h2 className="text-2xl font-black">{stats.totalUsers}</h2>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="mb-10">
        <h3 className="text-zinc-500 text-[12px] font-black uppercase tracking-[4px] mb-6">Pending Review</h3>
        <div className="space-y-4">
          {pendingAds.map(ad => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              key={ad.id} 
              className="bg-zinc-900/30 border border-white/5 p-4 rounded-3xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img src={ad.img} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-sm">{ad.name}</h4>
                  <p className="text-xs text-cyan-500 font-black">{ad.price} • By @{ad.user}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveAd(ad.id)} className="bg-green-500/20 text-green-500 p-3 rounded-2xl hover:bg-green-500 hover:text-white transition-all">
                  <FaCheck />
                </button>
                <button className="bg-red-500/20 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                  <FaTimes />
                </button>
              </div>
            </motion.div>
          ))}
          {pendingAds.length === 0 && <p className="text-zinc-700 font-bold italic">No pending transmissions...</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;