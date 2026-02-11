import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, FaShareAlt, FaCheckCircle, 
  FaBolt, FaRegHeart, FaRegComment, FaVolumeUp, FaVolumeMute, FaEye, 
  FaPaperPlane, FaSearch, FaRegBell, FaUserCircle, FaEnvelope, FaHome,
  FaStore, FaCog, FaLock, FaSatellite, FaFingerprint, FaUnlock, FaBrain,
  FaGhost, FaSyncAlt, FaHourglassHalf
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// কম্পোনেন্ট ইম্পোর্ট
import Marketplace from "./Marketplace"; 
import Notification from "./Notifications";
import Settings from "./Settings";
import LegacySetup from '../components/LegacySetup';
import Profile from "./Profile"; // ✅ Profile component import kora hoyeche

// --- ১. NEURAL INPUT COMPONENT (The Generator with Glitch Effect) ---
const NeuralInput = ({ onPostSuccess }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("IDLE"); // IDLE, SYNCING, SUCCESS

  const handleGenerate = async () => {
    if (!text.trim() || status === "SYNCING") return;
    setStatus("SYNCING");

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post("https://onyx-drift-app-final-u29m.onrender.com/api/posts/create", 
        { content: text, type: 'text' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setStatus("SUCCESS");
        setText("");
        if (onPostSuccess) onPostSuccess();
        setTimeout(() => setStatus("IDLE"), 3000);
      }
    } catch (err) {
      console.error("Neural Injection Failed:", err);
      setStatus("IDLE");
    }
  };

  return (
    <div className="bg-black/40 border border-cyan-500/30 p-6 rounded-[32px] backdrop-blur-xl mb-8 relative overflow-hidden group shadow-[0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex gap-5">
        <div className="relative">
          <img src={user?.picture} alt="me" className="w-14 h-14 rounded-2xl border-2 border-cyan-500/30 object-cover shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full animate-pulse" />
        </div>
        
        <div className="flex-1 space-y-4">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Broadcast your neural signal to the grid..."
            className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-600 resize-none font-mono text-sm h-24 scrollbar-hide"
          />
          
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <div className="flex gap-4">
              <button className="text-gray-500 hover:text-cyan-400 transition-all hover:scale-110"><FaImage size={20}/></button>
              <button className="text-gray-500 hover:text-purple-400 transition-all hover:scale-110"><FaSatellite size={20}/></button>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={status === "SYNCING"}
              className={`px-8 py-2.5 rounded-xl font-black text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all ${
                status === "SYNCING" 
                ? "bg-zinc-800 text-gray-500 cursor-not-allowed" 
                : "bg-cyan-500 text-black hover:bg-cyan-400"
              }`}
            >
              {status === "SYNCING" ? (
                <>
                  <FaSyncAlt className="animate-spin" />
                  SYNCING_CORE...
                </>
              ) : (
                <>
                  <FaBolt className="animate-pulse" />
                  INJECT_SIGNAL
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ২. MAIN PREMIUM HOME FEED COMPONENT ---
const PremiumHomeFeed = () => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE = "https://onyx-drift-app-final-u29m.onrender.com/api";

  const fetchCoreData = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const headers = { Authorization: `Bearer ${token}` };

      // Fixed: /api/user/profile mapping
      const profRes = await axios.get(`${API_BASE}/user/profile`, { headers });
      setUserProfile(profRes.data.user);

      // Fixed: /api/posts mapping for neural-feed
      const feedRes = await axios.get(`${API_BASE}/posts`, { headers });
      setPosts(feedRes.data || []);
      
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error("Neural Sync Critical Error:", err);
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
    const interval = setInterval(() => {
        if(activeTab === 'home') fetchCoreData();
    }, 60000); // Auto sync every minute
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab]);

  const handleLike = async (postId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_BASE}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.map(p => p._id === postId ? res.data : p));
    } catch (err) {
      console.error("Signal feedback failed", err);
    }
  };

  const handleCommentSubmit = async () => {
    if(!commentText.trim() || !selectedPost) return;
    try {
        const token = await getAccessTokenSilently();
        const res = await axios.post(`${API_BASE}/posts/${selectedPost._id}/comment`, 
            { text: commentText },
            { headers: { Authorization: `Bearer ${token}` }}
        );
        setSelectedPost(res.data);
        setPosts(posts.map(p => p._id === selectedPost._id ? res.data : p));
        setCommentText("");
    } catch (err) {
        console.error("Resonance injection failed");
    }
  };

  // UI RENDER LOGIC
  if (loading) return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[1000]">
      <div className="relative">
        <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }} 
            className="w-24 h-24 border-t-2 border-b-2 border-cyan-500 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)]"
        />
        <FaBrain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500 animate-pulse" size={30}/>
      </div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 text-cyan-500 font-mono text-xs tracking-[0.5em] uppercase"
      >
        Synchronizing Neural Grid...
      </motion.p>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'market': return <Marketplace />;
      case 'notifications': return <Notification />;
      case 'settings': return <Settings />;
      case 'profile': return <Profile />;
      default: return (
        <div className="max-w-2xl mx-auto pt-24 pb-32 px-4">
          <NeuralInput onPostSuccess={fetchCoreData} />
          
          <div className="space-y-8">
            <AnimatePresence>
                {posts.map((post, idx) => (
                <motion.div 
                    key={post._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative bg-zinc-900/40 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-500 shadow-2xl"
                >
                    {/* Post Glass Header */}
                    <div className="p-5 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img src={post.authorAvatar || "https://via.placeholder.com/150"} className="w-12 h-12 rounded-[18px] object-cover border border-white/10 group-hover:border-cyan-500/50 transition-all" />
                            {post.isAiGenerated && <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center"><FaBrain size={8} className="text-black"/></div>}
                        </div>
                        <div>
                        <h4 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                            {post.authorName} 
                            <span className="bg-cyan-500/10 text-cyan-400 text-[8px] px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-widest">Verified</span>
                        </h4>
                        <p className="text-gray-500 text-[10px] font-mono mt-0.5">{new Date(post.createdAt).toLocaleTimeString()} • GRID_LOC: {idx + 1042}</p>
                        </div>
                    </div>
                    <button className="text-gray-600 hover:text-white transition-colors"><FaShareAlt size={14}/></button>
                    </div>

                    {/* Content Section */}
                    <div className="px-6 pb-4">
                    <p className="text-gray-200 text-sm leading-relaxed font-light mb-5 selection:bg-cyan-500/30">{post.text}</p>
                    {post.media && (
                        <div className="relative rounded-[28px] overflow-hidden border border-white/5 group/media">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity z-10" />
                            {post.mediaType === 'video' || post.mediaType === 'reel' ? (
                                <video src={post.media} controls className="w-full h-auto max-h-[500px] object-cover" />
                            ) : (
                                <img src={post.media} className="w-full h-auto object-cover max-h-[500px]" alt="signal-capture" />
                            )}
                        </div>
                    )}
                    </div>

                    {/* Futuristic Interaction Bar */}
                    <div className="px-6 py-5 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-8">
                            <motion.button 
                                whileTap={{ scale: 0.8 }}
                                onClick={() => handleLike(post._id)} 
                                className={`flex items-center gap-2.5 transition-all ${post.likes?.includes(user?.sub) ? 'text-rose-500' : 'text-gray-500 hover:text-rose-400'}`}
                            >
                                {post.likes?.includes(user?.sub) ? <FaHeart size={18} className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"/> : <FaRegHeart size={18}/>}
                                <span className="text-[11px] font-black font-mono tracking-widest">{post.likes?.length || 0}</span>
                            </motion.button>
                            
                            <button onClick={() => setSelectedPost(post)} className="flex items-center gap-2.5 text-gray-500 hover:text-cyan-400 transition-all">
                                <FaRegComment size={18}/>
                                <span className="text-[11px] font-black font-mono tracking-widest">{post.comments?.length || 0}</span>
                            </button>
                            
                            <div className="flex items-center gap-2.5 text-gray-700">
                                <FaEye size={16}/>
                                <span className="text-[11px] font-mono tracking-widest">{post.views || 0}</span>
                            </div>
                        </div>
                        
                        {post.isAiGenerated && (
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                <span className="text-[9px] font-mono text-cyan-500 uppercase font-bold tracking-tighter">Neural Sync: {post.neuralSyncLevel || "98.2"}%</span>
                            </div>
                        )}
                    </div>
                </motion.div>
                ))}
            </AnimatePresence>
            
            {posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <FaGhost size={60} className="mb-6"/>
                <p className="font-mono text-xs tracking-[0.5em] uppercase">No Signals Detected In This Sector</p>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Top Fixed Neural Nav */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-8 z-[100]">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 180 }}
            className="w-10 h-10 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <FaBrain className="text-black text-xl"/>
          </motion.div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-2xl italic leading-none">ONYX<span className="text-cyan-500">DRIFT</span></span>
            <span className="text-[8px] font-mono text-cyan-500/50 tracking-[0.4em] uppercase">Neural_Network_v4.2</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 group cursor-help">
             <FaBolt className="text-cyan-400 group-hover:animate-bounce"/>
             <div className="flex flex-col">
                <span className="text-[10px] font-black font-mono leading-none">{userProfile?.stats?.neuralImpact || 0}</span>
                <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">Impact_Points</span>
             </div>
          </div>
          
          <div className="relative group">
            <img 
                src={user?.picture} 
                alt="profile"
                onClick={() => setActiveTab('profile')}
                className="w-11 h-11 rounded-2xl border-2 border-white/10 cursor-pointer hover:border-cyan-500 transition-all p-0.5 object-cover" 
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-cyan-500 border-2 border-black rounded-full" />
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {renderContent()}
      </main>

      {/* Futuristic Bottom Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[100]">
        <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 h-20 rounded-[35px] flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {[
            { id: 'home', icon: <FaHome />, label: 'Grid' },
            { id: 'market', icon: <FaStore />, label: 'Vault' },
            { id: 'notifications', icon: <FaRegBell />, label: 'Pulse' },
            { id: 'settings', icon: <FaCog />, label: 'Config' }
            ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative group flex flex-col items-center justify-center w-16 h-16 transition-all"
            >
                <div className={`text-2xl transition-all duration-300 ${activeTab === tab.id ? 'text-cyan-500 -translate-y-1' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {tab.icon}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 transition-all ${activeTab === tab.id ? 'opacity-100 text-cyan-500' : 'opacity-0'}`}>
                    {tab.label}
                </span>
                {activeTab === tab.id && (
                    <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 bg-cyan-500/10 rounded-2xl -z-10 blur-xl"
                    />
                )}
            </button>
            ))}
        </div>
      </div>

      {/* Full Screen Resonance Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-t-[50px] sm:rounded-[50px] border-t sm:border border-white/10 overflow-hidden flex flex-col max-h-[92vh] shadow-[0_-20px_50px_rgba(0,0,0,1)]"
            >
              <div className="p-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-cyan-500 rounded-full" />
                    <div>
                        <h3 className="font-black text-xl uppercase tracking-tighter">Signal Resonance</h3>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active_Comments: {selectedPost.comments?.length || 0}</p>
                    </div>
                </div>
                <button onClick={() => setSelectedPost(null)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                    <FaTimes/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {selectedPost.comments?.length > 0 ? selectedPost.comments.map((c, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className="flex gap-5 group"
                  >
                    <img src={c.userAvatar || "https://via.placeholder.com/150"} className="w-10 h-10 rounded-xl object-cover border border-white/5 group-hover:border-cyan-500/30 transition-all" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-cyan-400 font-mono uppercase tracking-widest">{c.userName || "Anonymous"}</span>
                        <span className="text-[8px] text-gray-600 font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                        <p className="text-sm text-gray-300 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <FaRegComment size={40} className="mb-4 text-gray-600"/>
                        <p className="text-[10px] font-mono tracking-[0.3em] uppercase">No resonance detected yet</p>
                    </div>
                )}
              </div>

              <div className="p-8 bg-black/60 border-t border-white/5 flex gap-4 items-center">
                <div className="flex-1 flex items-center bg-white/5 rounded-3xl border border-white/10 focus-within:border-cyan-500/50 transition-all shadow-inner px-4">
                    <input 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                    placeholder="Inject your resonance into the grid..."
                    className="w-full bg-transparent py-4 outline-none text-sm text-gray-200 font-mono"
                    />
                </div>
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCommentSubmit}
                    className="bg-cyan-500 text-black w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition-all"
                >
                    <FaPaperPlane size={18}/>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5, boxShadow: "0 0 40px rgba(6,182,212,0.6)" }} 
        whileTap={{ scale: 0.9 }} 
        onClick={() => setIsPostModalOpen(true)} 
        className="fixed bottom-32 right-8 w-18 h-18 bg-cyan-500 text-black rounded-[24px] flex items-center justify-center z-[100] shadow-[0_0_30px_rgba(6,182,212,0.4)] md:w-20 md:h-20"
      >
        <FaBrain size={28}/>
      </motion.button>
      
      {/* Visual Glitch Overlays */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-[1000] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </div>
  );
};

export default PremiumHomeFeed;