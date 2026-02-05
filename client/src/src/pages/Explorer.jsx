import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineMagnifyingGlass, HiOutlineSparkles, HiOutlineFire, 
  HiOutlineEye, HiOutlineUserGroup, HiOutlinePlus 
} from "react-icons/hi2";
import ChatRoom from "../components/ChatRoom"; 

const Explorer = ({ socket, user }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [nodes, setNodes] = useState([]); // ডাটাবেস থেকে আসা নোড বা কমিউনিটি
  const [activeNodeId, setActiveNodeId] = useState("global-explorer"); // বর্তমান চ্যাটরুম আইডি
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["All", "Digital Art", "Cyberpunk", "AI Generated", "Minimal", "Nature"];
  const glassStyle = "bg-[#030712]/60 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-[2.5rem]";

  // --- API থেকে রিয়েল ডাটা ফেচ করা ---
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await axios.get("https://onyx-drift-app-final.onrender.com/api/communities/all");
        setNodes(res.data);
      } catch (err) {
        console.error("Node synchronization failed", err);
      }
    };
    fetchNodes();
  }, []);

  // সার্চ এবং ক্যাটাগরি ফিল্টার লজিক
  const filteredNodes = nodes.filter(node => {
    const matchesCategory = selectedCategory === "All" || node.topic === selectedCategory;
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen py-6 animate-fadeIn px-4">
      {/* ১. মেইন লেআউট (Responsive Flex) */}
      <div className="max-w-[1550px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* ২. এক্সপ্লোরার কন্টেন্ট সেকশন (Left) */}
        <div className="flex-1">
          
          {/* সার্চ এবং ফিল্টার বার */}
          <div className="mb-10 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-[450px]">
                <HiOutlineMagnifyingGlass className="absolute left-6 top-4 text-cyan-500/50" size={20} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="SEARCH NEURAL NODES..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-6 text-[10px] tracking-[0.2em] outline-none focus:border-cyan-500/40 transition-all placeholder:text-gray-600 font-bold uppercase"
                />
              </div>
              
              <div className="flex gap-3 overflow-x-auto no-scrollbar w-full md:w-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                      ${selectedCategory === cat 
                        ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                        : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">
                <HiOutlineFire className="text-orange-500 animate-pulse" />
                <span>Trending: #NeuralLink #OnyxDrift #Web3Social</span>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors">
                <HiOutlinePlus /> Create New Node
              </button>
            </div>
          </div>

          {/* ম্যাসোনারি গ্রিড (Dynamic Nodes) */}
          <div className="columns-1 sm:columns-2 xl:columns-3 gap-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredNodes.length > 0 ? filteredNodes.map((node) => (
                <motion.div
                  layout
                  key={node._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  onClick={() => setActiveNodeId(node._id)}
                  className={`relative break-inside-avoid ${glassStyle} group cursor-pointer overflow-hidden border-white/5 hover:border-cyan-500/30 transition-all duration-500`}
                >
                  <img 
                    src={node.avatar || `https://picsum.photos/600/800?random=${node._id}`} 
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[40%] group-hover:grayscale-0" 
                    alt={node.name} 
                  />
                  
                  {/* Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-90 flex flex-col justify-between p-6">
                    <div className="flex justify-end">
                        <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-400/20 p-2 rounded-xl text-cyan-400">
                           <HiOutlineSparkles size={18} />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-cyan-500/10 px-2 py-1 rounded text-cyan-400 border border-cyan-500/20">
                        {node.topic}
                      </span>
                      <h3 className="text-lg font-black italic uppercase tracking-tighter text-white group-hover:text-cyan-400 transition-colors">
                        {node.name}
                      </h3>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                           <HiOutlineUserGroup size={14} className="text-cyan-500" />
                           {node.members?.length || 0} DRIFTERS
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400 opacity-70 italic font-mono uppercase tracking-tighter">
                           Live Link
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-20 opacity-30 w-full col-span-full">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Neural Nodes Detected</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* লোড মোর */}
          <div className="flex justify-center py-20">
              <motion.button whileTap={{ scale: 0.9 }} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white/10 transition-all text-gray-500">
                Extend Sync Range
              </motion.button>
          </div>
        </div>

        {/* ৩. স্টিকি চ্যাটরুম সেকশন (Right) */}
        <aside className="hidden lg:block w-[380px] xl:w-[420px]">
            <div className="sticky top-24 h-[calc(100vh-140px)] flex flex-col">
              <ChatRoom 
                nodeId={activeNodeId} 
                user={user} 
                socket={socket} 
              />
              
              <div className="mt-6 p-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/5 to-transparent border border-cyan-500/10">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_cyan]" />
                   <p className="text-[10px] font-black text-cyan-400 uppercase italic tracking-[0.2em]">Neural Intelligence</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium uppercase tracking-tight">
                  Linked to Node: <span className="text-cyan-200">ID_{activeNodeId.slice(-6)}</span>. You are now communicating through an encrypted neural bridge.
                </p>
              </div>
            </div>
        </aside>

      </div>
    </div>
  );
};

export default Explorer;