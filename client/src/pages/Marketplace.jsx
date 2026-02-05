import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaShoppingCart, FaPlusCircle, 
  FaExternalLinkAlt, FaCommentDots, FaStore, FaBolt, FaLock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import toast from "react-hot-toast";
import PaymentGateway from './PaymentGateway'; 

const Marketplace = () => {
  const navigate = useNavigate();
  const { user: currentUser, getAccessTokenSilently } = useAuth0();
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [activeTab, setActiveTab] = useState('all');
  const [userImpact, setUserImpact] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  // ১. ইউজার ইমপ্যাক্ট পয়েন্ট ফেচ করা
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(`${API_URL}/api/user/profile/${currentUser?.sub}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserImpact(res.data.user.neuralImpact || 0);
      } catch (err) {
        console.error("Stats Error:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    if (currentUser) fetchUserStats();
  }, [currentUser]);

  // ২. প্রোডাক্ট লিস্ট (পয়েন্ট এবং টাকা উভয়ই সাপোর্ট করবে)
  const [items] = useState([
    { 
      id: 1, 
      name: "Cyberpunk Edition Watch", 
      price: "1250", 
      points: 5000,
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", 
      category: "electronics",
      isAffiliate: true,
      link: "https://www.daraz.com.bd/" 
    },
    { 
      id: 2, 
      name: "Neon Hoodie (Onyx Drift)", 
      price: "950", 
      points: 3500,
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500", 
      category: "fashion",
      isAffiliate: false,
      sellerName: "Sabbir Ahmed",
      sellerId: "user_123" 
    },
    { 
      id: 3, 
      name: "Neural Profile Glow", 
      price: "0", 
      points: 800,
      img: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=500", 
      category: "digital",
      isAffiliate: false,
      isDigital: true 
    }
  ]);

  return (
    <div className="p-4 bg-black min-h-screen pb-32 font-sans relative">
      
      {/* --- Header & Neural Balance --- */}
      <div className="flex flex-col gap-4 mb-6 pt-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
            <FaStore className="text-cyan-500" /> Drift Market
          </h1>
          
          <div className="flex items-center gap-3">
             <div className="bg-zinc-900 border border-cyan-500/20 px-3 py-1.5 rounded-xl text-right hidden md:block">
                <p className="text-[7px] uppercase font-black text-zinc-500 tracking-widest">Impact Balance</p>
                <div className="flex items-center gap-1 text-cyan-400 font-black text-sm">
                   <FaBolt className="text-yellow-500 text-[10px]" /> {userImpact}
                </div>
             </div>
             <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 transition-transform"
             >
                <FaPlusCircle /> Post Ads
             </button>
          </div>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search gear, gadgets or ads..." 
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/30 font-mono"
          />
        </div>
      </div>

      {/* --- Mobile Only Balance Bar --- */}
      <div className="md:hidden mb-6 bg-gradient-to-r from-cyan-900/20 to-transparent border border-white/5 p-3 rounded-2xl flex justify-between items-center">
         <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Neural Wallet</span>
         <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg">
            <FaBolt className="text-yellow-500" />
            <span className="text-white font-black">{userImpact} PTS</span>
         </div>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
        {['all', 'electronics', 'fashion', 'digital'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === cat ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4]' : 'bg-zinc-900 text-zinc-500 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- Marketplace Grid --- */}
      <div className="grid grid-cols-2 gap-4">
        {items.filter(i => activeTab === 'all' || i.category === activeTab).map((item) => (
          <motion.div 
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/40 border border-white/5 rounded-[28px] overflow-hidden flex flex-col h-full shadow-lg group"
          >
            <div className="relative aspect-square overflow-hidden">
              <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
              
              {item.isAffiliate && (
                <span className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-[8px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest">
                  External Ad
                </span>
              )}
              
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
                 <FaBolt className="text-yellow-500 text-[8px]" />
                 <span className="text-[9px] font-black text-white">{item.points}</span>
              </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-200 line-clamp-1 italic">{item.name}</h3>
              <div className="flex justify-between items-center mt-1">
                 <p className="text-lg font-black text-cyan-500">৳{item.price}</p>
                 <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Impact Ready</p>
              </div>
              
              <div className="mt-auto pt-4 space-y-2">
                <button 
                  onClick={() => item.isAffiliate ? window.open(item.link, "_blank") : setSelectedProduct(item)}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    item.isAffiliate ? 'bg-blue-600 text-white' : 'bg-white text-black active:scale-95'
                  }`}
                >
                  {item.isAffiliate ? <><FaExternalLinkAlt size={10} /> Visit Ad</> : <><FaShoppingCart size={12} /> Buy Now</>}
                </button>

                {!item.isAffiliate && (
                  <button 
                    onClick={() => navigate(`/messenger/${item.sellerId}`)}
                    className="w-full py-2.5 bg-zinc-800/30 border border-white/5 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                  >
                    <FaCommentDots size={12} /> DM Seller
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- PAYMENT GATEWAY & IMPACT EXCHANGE MODAL --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              {/* Point Purchase Option */}
              <div className="bg-zinc-900 border border-cyan-500/30 rounded-[35px] p-6 mb-4 shadow-2xl">
                 <h4 className="text-white font-black uppercase text-xs mb-4 tracking-widest text-center">Neural Impact Exchange</h4>
                 <button 
                    onClick={() => {
                        if(userImpact >= selectedProduct.points) {
                           toast.success("Transaction via Neural Link Successful!");
                           setSelectedProduct(null);
                        } else {
                           toast.error("Low Impact Points!");
                        }
                    }}
                    className="w-full py-4 bg-cyan-950/40 border border-cyan-500/20 rounded-2xl flex items-center justify-between px-6 group hover:bg-cyan-500 transition-all"
                 >
                    <div className="text-left">
                       <p className="text-[10px] font-black text-cyan-400 group-hover:text-black uppercase">Pay with Points</p>
                       <p className="text-white group-hover:text-black font-black text-lg">{selectedProduct.points} PTS</p>
                    </div>
                    {userImpact < selectedProduct.points ? <FaLock className="text-zinc-600" /> : <FaBolt className="text-yellow-500 group-hover:text-black animate-pulse" />}
                 </button>
                 <p className="text-[8px] text-zinc-600 mt-3 text-center uppercase font-bold tracking-widest">Balance: {userImpact} PTS</p>
              </div>

              <div className="text-center mb-4">
                 <span className="text-zinc-700 font-black text-[9px] uppercase tracking-[5px]">-- OR --</span>
              </div>

              <PaymentGateway 
                amount={selectedProduct.price} 
                onSuccess={() => {
                   toast.success("Success! Signal Transmitted.");
                   setSelectedProduct(null);
                }} 
              />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-full mt-6 text-zinc-600 font-bold text-[10px] uppercase tracking-[3px] hover:text-red-500 transition-colors"
              >
                Abort Sync
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- POST AD MODAL --- */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[35px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Deploy Signal</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest">Gear Name</label>
                  <input type="text" className="w-full bg-black/50 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-mono" placeholder="Cyber Gear X" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest">Price (৳)</label>
                    <input type="text" className="w-full bg-black/50 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-mono" placeholder="999" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest">Category</label>
                    <select className="w-full bg-black/50 border border-white/5 p-4 rounded-2xl text-white text-[10px] outline-none font-black uppercase">
                      <option>Electronics</option>
                      <option>Fashion</option>
                      <option>Digital</option>
                    </select>
                  </div>
                </div>
                <button className="w-full bg-cyan-500 text-black font-black py-4 rounded-2xl uppercase tracking-tighter text-sm mt-4 active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:bg-cyan-400">
                  Execute Deployment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Marketplace;