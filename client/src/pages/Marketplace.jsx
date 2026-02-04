import React, { useState } from 'react';
import { 
  FaSearch, FaShoppingCart, FaPlusCircle, 
  FaExternalLinkAlt, FaCommentDots, FaStore
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PaymentGateway from './PaymentGateway'; 

const Marketplace = () => {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [activeTab, setActiveTab] = useState('all');

  // প্রোডাক্ট লিস্ট
  const [items] = useState([
    { 
      id: 1, 
      name: "Cyberpunk Edition Watch", 
      price: "1250", 
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", 
      category: "electronics",
      isAffiliate: true,
      link: "https://www.daraz.com.bd/" 
    },
    { 
      id: 2, 
      name: "Streetwear Neon Hoodie", 
      price: "950", 
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500", 
      category: "fashion",
      isAffiliate: false,
      sellerName: "Sabbir Ahmed",
      sellerId: "user_123" 
    }
  ]);

  return (
    <div className="p-4 bg-black min-h-screen pb-32 font-sans relative">
      
      {/* Header & Search */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
            <FaStore className="text-cyan-500" /> Drift Market
          </h1>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <FaPlusCircle /> Post Ads
          </button>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search gear, gadgets or ads..." 
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/30"
          />
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
        {['all', 'electronics', 'fashion', 'digital'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === cat ? 'bg-cyan-500 text-black' : 'bg-zinc-900 text-zinc-500 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-2 gap-4">
        {items.filter(i => activeTab === 'all' || i.category === activeTab).map((item) => (
          <motion.div 
            key={item.id}
            layout
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-zinc-900/40 border border-white/5 rounded-[28px] overflow-hidden flex flex-col h-full shadow-lg"
          >
            <div className="relative aspect-square">
              <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
              {item.isAffiliate && (
                <span className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-[8px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-xl">
                  External Ad
                </span>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-200 line-clamp-1">{item.name}</h3>
              <p className="text-lg font-black text-cyan-500 mt-1">৳{item.price}</p>
              
              <div className="mt-auto pt-4 space-y-2">
                <button 
                  onClick={() => item.isAffiliate ? window.open(item.link, "_blank") : setSelectedProduct(item)}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    item.isAffiliate ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-zinc-200 shadow-xl'
                  }`}
                >
                  {item.isAffiliate ? <><FaExternalLinkAlt size={10} /> Visit Ad</> : <><FaShoppingCart size={12} /> Buy Now</>}
                </button>

                {!item.isAffiliate && (
                  <button 
                    onClick={() => navigate(`/messenger/${item.sellerId}`)}
                    className="w-full py-2.5 bg-zinc-800/50 border border-white/5 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800"
                  >
                    <FaCommentDots size={12} /> Message Seller
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- PAYMENT GATEWAY MODAL --- */}
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
              <PaymentGateway 
                amount={selectedProduct.price} 
                onSuccess={() => {
                   alert("Success! Signal Transmitted.");
                   setSelectedProduct(null);
                }} 
              />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-full mt-4 text-zinc-600 font-bold text-[10px] uppercase tracking-[3px] hover:text-white transition-colors"
              >
                Abort Transaction
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
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Post Your Signal</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-500 hover:text-white">
                  ✕
                </button>
              </div>
              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-cyan-500 uppercase ml-2">Product Name</label>
                  <input type="text" className="w-full bg-black/50 border border-white/5 p-3 rounded-2xl text-white text-sm outline-none" placeholder="Cyber Gear" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-2">Price (৳)</label>
                    <input type="text" className="w-full bg-black/50 border border-white/5 p-3 rounded-2xl text-white text-sm outline-none" placeholder="500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-2">Category</label>
                    <select className="w-full bg-black/50 border border-white/5 p-3 rounded-2xl text-white text-[10px] outline-none">
                      <option>Electronics</option>
                      <option>Fashion</option>
                    </select>
                  </div>
                </div>
                <button className="w-full bg-cyan-500 text-black font-black py-4 rounded-2xl uppercase tracking-tighter text-sm mt-4 active:scale-95 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  Deploy to Market
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