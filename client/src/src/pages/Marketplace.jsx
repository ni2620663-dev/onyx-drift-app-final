import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaShoppingCart, FaPlusCircle, 
  FaExternalLinkAlt, FaCommentDots, FaStore, FaBolt, FaLock, FaArrowRight, FaTag
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import toast from "react-hot-toast";
import PaymentGateway from '../components/PaymentGateway'; 

const Marketplace = () => {
  const navigate = useNavigate();
  const { user: currentUser, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [activeTab, setActiveTab] = useState('all');
  const [userImpact, setUserImpact] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  // ১. ইউজার ইমপ্যাক্ট পয়েন্ট ফেচ করা
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!isAuthenticated) return;
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
    fetchUserStats();
  }, [currentUser, isAuthenticated, API_URL, getAccessTokenSilently]);

  // ২. ডামি ডাটা (ব্যাকএন্ড কানেক্ট করলে এখান থেকে সরাতে হবে)
  const items = [
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
  ];

  const handlePointPurchase = async (product) => {
    if (userImpact >= product.points) {
      toast.loading("Encrypting Transaction...", { duration: 1500 });
      setTimeout(() => {
        toast.success("Transaction via Neural Link Successful!");
        setUserImpact(prev => prev - product.points);
        setSelectedProduct(null);
      }, 1500);
    } else {
      toast.error("Insufficient Impact Points! Post more to earn.");
    }
  };

  return (
    <div className="p-4 bg-[#020617] min-h-screen pb-32 font-sans relative text-white">
      
      {/* --- Header & Neural Balance --- */}
      <div className="flex flex-col gap-4 mb-6 pt-6">
        <div className="flex justify-between items-center">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-2"
          >
            <FaStore className="text-cyan-500" /> Drift Market
          </motion.h1>
          
          <div className="flex items-center gap-3">
             <div className="bg-zinc-900/80 border border-cyan-500/20 px-4 py-1.5 rounded-2xl hidden md:block backdrop-blur-xl">
                <p className="text-[8px] uppercase font-black text-zinc-500 tracking-[0.2em]">Neural Balance</p>
                <div className="flex items-center gap-1 text-cyan-400 font-black text-sm">
                   <FaBolt className="text-yellow-500 text-[10px]" /> {userImpact} <span className="text-[10px] text-zinc-600">PTS</span>
                </div>
             </div>
             <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-cyan-500 text-black px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 transition-all"
             >
                <FaPlusCircle /> Sell Gear
             </button>
          </div>
        </div>

        <div className="relative group">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search gear, gadgets or neural assets..." 
            className="w-full bg-zinc-900/50 border border-white/5 rounded-[20px] py-4 pl-14 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500/40 transition-all font-mono placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* --- Categories Filter --- */}
      <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
        {['all', 'electronics', 'fashion', 'digital'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeTab === cat 
              ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
              : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- Marketplace Grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.filter(i => activeTab === 'all' || i.category === activeTab).map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-zinc-900/30 border border-white/5 rounded-[30px] overflow-hidden flex flex-col h-full group backdrop-blur-sm"
          >
            <div className="relative aspect-square overflow-hidden m-2 rounded-[25px]">
              <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
              
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {item.isAffiliate && (
                  <span className="bg-blue-600/90 backdrop-blur-md text-[8px] font-black text-white px-2 py-1 rounded-lg uppercase tracking-widest">Ad</span>
                )}
                {item.isDigital && (
                  <span className="bg-purple-600/90 backdrop-blur-md text-[8px] font-black text-white px-2 py-1 rounded-lg uppercase tracking-widest italic flex items-center gap-1"><FaBolt size={8}/> Neural</span>
                )}
              </div>
              
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
                 <FaBolt className="text-yellow-500 text-[10px]" />
                 <span className="text-[10px] font-black text-white">{item.points}</span>
              </div>
            </div>

            <div className="p-4 pt-2 flex flex-col flex-1">
              <h3 className="text-xs font-black text-zinc-300 line-clamp-1 uppercase tracking-tight mb-1">{item.name}</h3>
              <div className="flex justify-between items-baseline">
                 <p className="text-xl font-black text-cyan-400 tracking-tighter">৳{item.price}</p>
                 <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">Verified Drifter</span>
              </div>
              
              <div className="mt-4 space-y-2">
                <button 
                  onClick={() => item.isAffiliate ? window.open(item.link, "_blank") : setSelectedProduct(item)}
                  className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    item.isAffiliate ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-white text-black hover:bg-cyan-400'
                  }`}
                >
                  {item.isAffiliate ? <><FaExternalLinkAlt size={10} /> Visit Store</> : <><FaShoppingCart size={12} /> Acquire</>}
                </button>

                {!item.isAffiliate && (
                  <button 
                    onClick={() => navigate(`/messenger/${item.sellerId}`)}
                    className="w-full py-3 bg-zinc-800/20 border border-white/5 rounded-2xl text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all hover:text-white"
                  >
                    <FaCommentDots size={12} /> Contact Seller
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- PURCHASE MODAL (POINT & CASH) --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0a0f1e] border border-white/10 rounded-[40px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden mb-4 border border-white/10">
                  <img src={selectedProduct.img} className="w-full h-full object-cover" alt="item" />
                </div>
                <h2 className="text-white font-black uppercase italic tracking-tighter">{selectedProduct.name}</h2>
                <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1 tracking-widest">Select Acquisition Method</p>
              </div>

              <div className="space-y-4">
                {/* Pay with Points */}
                <button 
                  onClick={() => handlePointPurchase(selectedProduct)}
                  className="w-full p-5 bg-cyan-950/20 border border-cyan-500/30 rounded-[25px] flex items-center justify-between group hover:bg-cyan-500 transition-all"
                >
                  <div className="text-left">
                    <p className="text-[9px] font-black text-cyan-400 group-hover:text-black uppercase tracking-widest mb-1">Impact Exchange</p>
                    <p className="text-white group-hover:text-black font-black text-xl">{selectedProduct.points} <span className="text-xs uppercase">PTS</span></p>
                  </div>
                  {userImpact < selectedProduct.points ? <FaLock className="text-zinc-600" /> : <FaBolt className="text-yellow-500 group-hover:text-black animate-pulse" />}
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[9px] font-black text-zinc-700 uppercase italic">Or Cash</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                {/* Pay with Cash */}
                <PaymentGateway 
                  amount={selectedProduct.price} 
                  onSuccess={() => {
                    toast.success("Transaction Synced via BKash/Nagad!");
                    setSelectedProduct(null);
                  }} 
                />
              </div>

              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-full mt-8 text-zinc-600 font-black text-[10px] uppercase tracking-[3px] hover:text-red-500 transition-colors"
              >
                Cancel Sync
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
              className="absolute inset-0 bg-black/95 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] p-10 shadow-3xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Deploy Gear</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest flex items-center gap-2"><FaTag size={10}/> Gear Identification</label>
                  <input type="text" className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-mono" placeholder="ex: Neural Lens v2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest">Price (৳)</label>
                    <input type="number" className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-mono" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-2 tracking-widest">Category</label>
                    <select className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white text-[10px] outline-none font-black uppercase appearance-none">
                      <option>Electronics</option>
                      <option>Fashion</option>
                      <option>Digital Asset</option>
                    </select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-white/5 rounded-3xl p-8 text-center hover:border-cyan-500/30 transition-all cursor-pointer group">
                  <FaPlusCircle className="mx-auto text-zinc-600 mb-2 group-hover:text-cyan-500" size={24} />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Upload Blueprint / Image</p>
                </div>

                <button className="w-full bg-cyan-500 text-black font-black py-5 rounded-2xl uppercase tracking-tighter text-sm mt-4 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:bg-white transition-all flex items-center justify-center gap-2">
                  Confirm Deployment <FaArrowRight size={12}/>
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