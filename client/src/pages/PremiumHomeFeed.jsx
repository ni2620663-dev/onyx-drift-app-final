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

// ✅ কনফিগারেশন (আপনার ব্যাকএন্ডের সাথে মিল রাখা হয়েছে)
const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const AUTH_AUDIENCE = "https://onyx-drift-api.com";

// --- ১. NEURAL TOAST ---
const NeuralToast = ({ isVisible, message }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        className="fixed top-20 right-4 z-[9999] pointer-events-none"
      >
        <div className="bg-black/90 backdrop-blur-2xl border border-purple-500/40 p-4 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-4 min-w-[260px]">
          <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
            <FaBrain className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] mb-0.5">Neural Shadow Sync</h4>
            <p className="text-[11px] text-gray-300 font-mono italic">{message}</p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- ২. NEURAL INPUT (AI Generation Fix) ---
const NeuralInput = ({ onPostSuccess }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("IDLE"); 

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setStatus("SYNCING");
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE }
      });
      
      // ✅ ব্যাকএন্ডের Post কন্ট্রোলারের সাথে মিল রেখে রিকোয়েস্ট
      const res = await axios.post(`${API_URL}/api/posts`, {
        text,
        isAiGenerated: true,
        aiPersona: "Neural Shadow"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data) {
        setStatus("SUCCESS");
        setTimeout(() => {
            setStatus("IDLE");
            setText("");
            if (onPostSuccess) onPostSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error("Neural Sync Failed", err);
      setStatus("IDLE");
    }
  };

  return (
    <motion.div 
      animate={status === "SYNCING" ? { x: [0, -2, 2, 0], filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] } : {}}
      transition={{ repeat: Infinity, duration: 0.2 }}
      className="bg-[#080808] border border-cyan-500/20 p-5 rounded-[24px] mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
         <h3 className="text-cyan-500 font-mono text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
            <FaBrain className={status === "SYNCING" ? "animate-spin" : ""} /> Neural_Core_v2
         </h3>
      </div>
      <textarea 
        className="w-full bg-transparent border-none outline-none text-gray-200 font-mono text-sm placeholder-zinc-700 resize-none min-h-[80px]"
        placeholder="Type a thought to synthesize..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-3">
        <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">
            {status === "SYNCING" ? ">> SYNTHESIZING..." : ">> AWAITING_INPUT"}
        </span>
        <button 
          onClick={handleGenerate}
          disabled={status === "SYNCING" || !text.trim()}
          className="px-6 py-2 rounded-xl text-[10px] font-black border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all"
        >
          {status === "SYNCING" ? "SYNCING..." : "Execute"}
        </button>
      </div>
    </motion.div>
  );
};

// --- ৩. ভিডিও কম্পোনেন্ট ---
const CompactVideo = ({ src }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black w-full">
      <video ref={videoRef} src={src} autoPlay muted={isMuted} loop playsInline className="w-full h-auto max-h-[450px] object-cover" />
      <button 
        onClick={() => setIsMuted(!isMuted)} 
        className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white z-10 backdrop-blur-md border border-white/10"
      >
        {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} className="text-cyan-400" />}
      </button>
    </div>
  );
};

// --- ৪. মেইন ফিড কম্পোনেন্ট ---
const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const postMediaRef = useRef(null);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState("home"); 
  const [activeFilter, setActiveFilter] = useState("Global");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false); 
  const [userProfile, setUserProfile] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE }
      });
      const response = await axios.get(`${API_URL}/api/posts/neural-feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (err) { 
      console.error("Feed Fetch Error", err);
    } finally { setLoading(false); }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE }
      });
      const res = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(res.data);
    } catch (err) { 
        setUserProfile({});
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchUserProfile();
        fetchPosts();
    }
  }, [isAuthenticated]);

  const handleLike = async (postId) => {
    if (!user?.sub) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE }
      });
      const res = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
    } catch (err) { console.error("Like Error"); }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE }
      });
      const formData = new FormData();
      formData.append("text", postText);
      formData.append("isEncrypted", isEncrypted);
      if (mediaFile) formData.append("media", mediaFile);
      
      const response = await axios.post(`${API_URL}/api/posts`, formData, { 
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        } 
      });
      setPosts(prev => [response.data, ...prev]);
      setPostText(""); setMediaFile(null); setIsPostModalOpen(false);
      setToast({ show: true, message: "Uplink Successful" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
    } catch (err) { 
        alert("Transmission Failed."); 
    } finally { setIsSubmitting(false); }
  };

  const handleCommentSubmit = async () => {
    if(!commentText.trim() || !activeCommentPost) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE }
      });
      const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, { 
        text: commentText 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setPosts(prev => prev.map(p => p._id === activeCommentPost._id ? res.data : p));
      setActiveCommentPost(res.data);
      setCommentText("");
    } catch (err) { console.error("Comment Error"); }
  };

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeFilter === "Encrypted") result = posts.filter(p => p.isEncrypted);
    if (activeFilter === "Resonance") result = posts.filter(p => p.isAiGenerated);
    if (searchQuery) {
        result = result.filter(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [posts, activeFilter, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      <NeuralToast isVisible={toast.show} message={toast.message} />

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer object-cover" 
            onClick={() => setIsSideMenuOpen(true)} 
            alt="profile" 
          />
          <h2 className="text-lg font-black italic text-cyan-500 tracking-tighter uppercase cursor-pointer" onClick={() => setActiveTab('home')}>
            Onyx<span className="text-white">Drift</span>
          </h2>
        </div>
        <div className="flex gap-4 items-center">
          <FaSearch className="text-zinc-400 cursor-pointer" onClick={() => navigate('/search')} />
          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
            <FaBolt className="text-cyan-500 text-[10px]" />
            <span className="text-[10px] font-mono text-cyan-200">{userProfile?.neuralRank || 0}</span>
          </div>
        </div>
      </header>

      {/* --- SIDE MENU --- */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSideMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-[280px] bg-[#050505] border-r border-cyan-500/10 z-[201] p-6 shadow-2xl">
               <div className="mb-10 group cursor-pointer" onClick={() => { navigate(`/profile/${user?.sub}`); setIsSideMenuOpen(false); }}>
                  <div className="relative w-16 h-16 mb-4">
                    <img src={user?.picture} className="w-full h-full rounded-2xl border-2 border-cyan-500/20 object-cover" alt="user" />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 p-1 rounded-lg text-[8px] text-black font-black uppercase">Level {userProfile?.neuralRank || 1}</div>
                  </div>
                  <h4 className="font-black text-gray-100 text-lg uppercase">{user?.nickname}</h4>
                  <p className="text-[9px] text-cyan-500 font-mono tracking-widest mt-1">Neural Link: ACTIVE</p>
               </div>

               <nav className="flex flex-col gap-2">
                 {[
                   { icon: <FaHome />, label: 'Neural Feed', tab: 'home' }, 
                   { icon: <FaStore />, label: 'Marketplace', tab: 'market' }, 
                   { icon: <FaBrain />, label: 'AI Twin Sync', path: `/ai-twin` }, 
                   { icon: <FaFingerprint />, label: 'Digital Legacy', tab: 'legacy' },
                   { icon: <FaCog />, label: 'Settings', tab: 'settings' }
                 ].map((item, i) => (
                   <div key={i} onClick={() => { if(item.tab) setActiveTab(item.tab); if(item.path) navigate(item.path); setIsSideMenuOpen(false); }} className={`flex items-center gap-4 p-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === item.tab ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-white'}`}>
                     <span className="text-lg">{item.icon}</span> {item.label}
                   </div>
                 ))}
               </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen bg-black/40">
        {activeTab === "home" && (
          <>
            <div className="flex justify-center gap-2 py-4 border-b border-white/5 sticky top-14 z-50 bg-black/80 backdrop-blur-md px-4">
              {['Global', 'Encrypted', 'Resonance'].map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeFilter === f ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-zinc-500 border-white/5'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="px-5 pt-6">
                <NeuralInput onPostSuccess={fetchPosts} />
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20 gap-4">
                   <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[9px] text-cyan-500 font-mono tracking-[2px]">Scanning Grid Waves...</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                  {filteredPosts.map((post) => (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={post._id} className={`p-5 transition-all ${post.isAiGenerated ? 'bg-purple-500/[0.03] border-l-2 border-purple-500' : 'hover:bg-white/[0.01]'}`}>
                      <div className="flex gap-3">
                        <img 
                          src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}`} 
                          className="w-11 h-11 rounded-2xl border border-white/10 object-cover cursor-pointer" 
                          alt="avatar" 
                          onClick={() => navigate(`/profile/${post.authorAuth0Id || post.userId}`)} // ✅ ID FIX
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-[11px] uppercase tracking-wide text-gray-200">
                                {post.authorName} {post.isAiGenerated && " [TWIN]"}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-600">
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-[13px] leading-relaxed ${post.isAiGenerated ? 'text-purple-300 italic font-mono' : 'text-gray-400'}`}>
                            {post.text}
                          </p>
                          {post.media && (
                            <div className="mt-3">
                              {post.media.match(/\.(mp4|webm|mov)$/i) ? <CompactVideo src={post.media} /> : <img src={post.media} className="w-full rounded-2xl border border-white/10 max-h-[450px] object-cover" alt="media" />}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-4">
                              <button onClick={() => handleLike(post._id)} className={`flex items-center gap-1.5 text-[10px] font-bold ${post.likes?.includes(user?.sub) ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}>
                                {post.likes?.includes(user?.sub) ? <FaHeart /> : <FaRegHeart />} {post.likes?.length || 0}
                              </button>
                              <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-cyan-400">
                                <FaRegComment /> {post.comments?.length || 0}
                              </button>
                            </div>
                            <button onClick={() => navigate(`/ai-analyze/${post._id}`)} className="text-zinc-600 hover:text-purple-400"><FaBrain size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
            )}
          </>
        )}
        
        {activeTab === "market" && <Marketplace />}
        {activeTab === "notify" && <Notification />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "legacy" && <div className="p-6"><LegacySetup /></div>}
      </main>

      {/* --- CREATE POST MODAL --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg bg-[#0A0A0A] border border-cyan-500/20 rounded-[32px] p-6 shadow-2xl">
              <textarea 
                placeholder="Broadcast your thoughts..." 
                value={postText} 
                onChange={(e) => setPostText(e.target.value)} 
                className="w-full bg-transparent outline-none text-white resize-none min-h-[150px] font-mono text-sm" 
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <input type="file" hidden ref={postMediaRef} onChange={(e) => setMediaFile(e.target.files[0])} />
                  <button onClick={() => postMediaRef.current.click()} className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-cyan-500 transition-colors">
                    <FaImage size={18} />
                  </button>
                  <button onClick={() => setIsEncrypted(!isEncrypted)} className={`p-3 rounded-xl border transition-colors ${isEncrypted ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-white/5 text-zinc-500'}`}>
                    <FaFingerprint size={18} />
                  </button>
                </div>
                <button 
                  disabled={isSubmitting || (!postText && !mediaFile)} 
                  onClick={handlePostSubmit} 
                  className="px-8 py-3 rounded-xl font-black text-[10px] bg-cyan-500 text-black uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  {isSubmitting ? "Syncing..." : "Transmit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- COMMENT MODAL --- */}
      <AnimatePresence>
        {activeCommentPost && (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPost(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0A0A0A] rounded-t-[32px] border-t border-white/10 h-[80vh] flex flex-col">
              <div className="p-4 border-b border-white/5 flex justify-center">
                 <div className="w-12 h-1 bg-white/10 rounded-full" />
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-8 h-8 rounded-xl" alt="" />
                    <div className="bg-white/5 p-3 rounded-2xl flex-1">
                        <p className="text-cyan-500 font-bold text-[9px] uppercase">{c.userName}</p>
                        <p className="text-[12px] text-gray-300 mt-1">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-black/50 border-t border-white/5 flex gap-2">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  placeholder="Inject resonance..." 
                  className="flex-1 bg-white/5 rounded-xl px-4 py-3 outline-none text-[12px]" 
                />
                <button onClick={handleCommentSubmit} className="bg-cyan-500 text-black p-3.5 rounded-xl">
                    <FaPaperPlane size={14}/>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAB - NEURAL UPLINK */}
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={() => setIsPostModalOpen(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-lg z-[100]"
      >
        <FaBolt size={20} />
      </motion.button>
    </div>
  );
};

export default PremiumHomeFeed;