import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, FaShareAlt, FaCheckCircle, 
  FaBolt, FaRegHeart, FaRegComment, FaVolumeUp, FaVolumeMute, FaEye, 
  FaPaperPlane, FaSearch, FaRegBell, FaUserCircle, FaEnvelope, FaHome,
  FaStore, FaCog, FaLock, FaSatellite, FaFingerprint, FaUnlock, FaBrain
  // FaZap এখান থেকে সরিয়ে দেওয়া হয়েছে কারণ এটি fa লাইব্রেরিতে নেই
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// কম্পোনেন্ট ইম্পোর্ট
import Marketplace from "./Marketplace"; 
import Notification from "./Notifications";
import Settings from "./Settings";

// --- ১. NEURAL TOAST COMPONENT ---
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
          <div className="relative">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
              <FaBrain className="animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div>
            <h4 className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] mb-0.5">Neural Shadow Sync</h4>
            <p className="text-[11px] text-gray-300 font-mono italic">{message}</p>
          </div>
          <FaBolt className="ml-auto text-yellow-500 text-[10px] animate-bounce" />
        </div>
        <motion.div 
          initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 4 }}
          className="h-0.5 bg-purple-500 mt-1 rounded-full shadow-[0_0_10px_#a855f7]"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

// --- ২. ভিডিও কম্পোনেন্ট ---
const CompactVideo = ({ src, onVideoClick }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const currentVideo = videoRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (currentVideo && entry.isIntersecting) currentVideo.play().catch(() => {});
      else if (currentVideo) currentVideo.pause();
    }, { threshold: 0.6 });
    if (currentVideo) observer.observe(currentVideo);
    return () => { if (currentVideo) observer.unobserve(currentVideo); };
  }, [src]);

  return (
    <div onClick={onVideoClick} className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black max-w-[400px] cursor-pointer group">
      <video ref={videoRef} src={src} muted={isMuted} loop playsInline className="w-full h-72 object-cover" />
      <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 z-10">
        {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} className="text-cyan-400" />}
      </button>
    </div>
  );
};

const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
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
  const [userLevel, setUserLevel] = useState(3); 
  const [toast, setToast] = useState({ show: false, message: "" });

  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
  const postMediaRef = useRef(null);

  // --- ডাটা ফেচিং ---
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${API_URL}/api/posts/neural-feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (err) { 
      const fallback = await axios.get(`${API_URL}/api/posts`);
      setPosts(fallback.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPosts();
    
    const aiMessages = [
      "Shadow AI just synchronized your latest drift.",
      "Resonance score increased by +0.42",
      "Neural link established with nearby node.",
      "Optimizing your profile for global sync.",
      "Shadow replied to 3 recent transmissions."
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setToast({ show: true, message: aiMessages[Math.floor(Math.random() * aiMessages.length)] });
        setTimeout(() => setToast({ show: false, message: "" }), 4000);
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const filteredPosts = useMemo(() => {
    let list = [...posts];
    if (activeFilter === "Resonance") return list.sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0));
    if (activeFilter === "Encrypted") return list.filter(p => p.isEncrypted);
    return list;
  }, [posts, activeFilter]);

  const handleLike = async (postId) => {
    const userId = user?.sub;
    if (!userId) return;
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: p.likes?.includes(userId) ? p.likes.filter(id => id !== userId) : [...(p.likes || []), userId] } : p));
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { fetchPosts(); }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("text", postText);
      formData.append("isEncrypted", isEncrypted);
      if (mediaFile) formData.append("media", mediaFile);
      const response = await axios.post(`${API_URL}/api/posts`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => [response.data, ...prev]);
      setPostText(""); setMediaFile(null); setIsPostModalOpen(false);
    } catch (err) { alert("Sync failed."); } finally { setIsSubmitting(false); }
  };

  const handleCommentSubmit = async () => {
    if(!commentText.trim() || !activeCommentPost) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, { text: commentText }, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.map(p => p._id === activeCommentPost._id ? res.data : p));
      setActiveCommentPost(res.data); setCommentText("");
    } catch (err) { console.error("Error"); }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      <NeuralToast isVisible={toast.show} message={toast.message} />

      {/* --- HEADER --- */}
      <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={user?.picture} className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer" onClick={() => setIsSideMenuOpen(true)} alt="" />
          <h2 className="text-lg font-bold italic text-cyan-500 tracking-tighter uppercase">OnyxDrift</h2>
        </div>
        <div className="flex gap-4 items-center text-zinc-400">
          <FaSearch className="cursor-pointer hover:text-white" onClick={() => navigate('/search')} />
          <div className="relative">
             <FaRegBell className="cursor-pointer hover:text-white" onClick={() => setActiveTab('notify')} />
             <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </div>
          <FaBolt className="text-cyan-500 animate-pulse cursor-pointer" onClick={() => setActiveFilter('Resonance')} />
        </div>
      </div>

      {/* --- SIDE MENU --- */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSideMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-[280px] bg-[#050505] border-r border-white/10 z-[201] p-6 text-left shadow-2xl">
               <div className="mb-10">
                  <div className="relative w-16 h-16 mb-4">
                    <img src={user?.picture} className="w-full h-full rounded-2xl border-2 border-cyan-500/20 object-cover shadow-[0_0_15px_rgba(6,182,212,0.1)]" alt="" />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 p-1 rounded-lg text-[8px] text-black font-black uppercase">Level {userLevel}</div>
                  </div>
                  <h4 className="font-black text-gray-100 text-lg uppercase tracking-tighter">{user?.nickname}</h4>
                  <p className="text-[9px] text-cyan-500 font-mono font-bold tracking-[2px]">NEURAL STATUS: OPTIMIZED</p>
               </div>
               <nav className="flex flex-col gap-2">
                 {[{ icon: <FaHome />, label: 'Home Feed', tab: 'home' }, { icon: <FaStore />, label: 'Marketplace', tab: 'market' }, { icon: <FaUserCircle />, label: 'My Profile', path: `/profile/${user?.sub}` }, { icon: <FaRegBell />, label: 'Notifications', tab: 'notify' }, { icon: <FaCog />, label: 'Settings', tab: 'settings' }].map((item, i) => (
                   <div key={i} onClick={() => { if(item.tab) setActiveTab(item.tab); if(item.path) navigate(item.path); setIsSideMenuOpen(false); }} className={`flex items-center gap-4 p-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === item.tab ? 'text-cyan-400 bg-cyan-500/10 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                     <span className="text-lg">{item.icon}</span> {item.label}
                   </div>
                 ))}
               </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <section className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen">
        {activeTab === "home" && (
          <>
            <div className="flex justify-center gap-2 py-4 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-14 z-50 px-4">
              {['Global', 'Encrypted', 'Resonance'].map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeFilter === f ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                  {f === 'Encrypted' && (userLevel < 3 ? <FaLock /> : <FaFingerprint />)}
                  {f === 'Resonance' && <FaBrain className="animate-pulse" />}
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20 gap-4">
                   <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[9px] text-cyan-500 font-mono animate-pulse uppercase tracking-[2px]">Accessing Neural Grid...</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                {activeFilter === 'Encrypted' && userLevel < 3 ? (
                  <div className="p-20 text-center">
                    <FaLock className="text-zinc-800 mx-auto mb-4" size={50} />
                    <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em]">Signal Restricted</h3>
                    <p className="text-[10px] text-zinc-600 mt-2">Level 3 Clearance required for decryption.</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={post._id} className={`p-5 transition-all ${post.isAiGenerated ? 'bg-purple-500/[0.04] border-l-2 border-purple-500' : 'hover:bg-white/[0.01]'}`}>
                      <div className="flex gap-3">
                        <div className="relative">
                          <img src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}`} className={`w-11 h-11 rounded-2xl border object-cover ${post.isAiGenerated ? 'border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'border-white/10'}`} alt="" />
                          {post.isAiGenerated && <div className="absolute -bottom-1 -right-1 bg-purple-500 p-1 rounded-full"><FaBrain size={8} className="text-white"/></div>}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-[13px] ${post.isAiGenerated ? 'text-purple-400' : 'text-gray-200'}`}>{post.authorName} {post.isAiGenerated && "[SHADOW]"}</span>
                              {post.isEncrypted && <FaFingerprint className="text-cyan-500 text-[10px]" />}
                            </div>
                            {post.isAiGenerated && <span className="text-[8px] text-purple-600 font-mono font-black uppercase tracking-tighter">Sync: {post.neuralSyncLevel}%</span>}
                          </div>
                          <p className={`text-sm leading-relaxed ${post.isAiGenerated ? 'text-gray-300 italic' : 'text-gray-400'}`}>{post.text}</p>
                          {post.media && (
                            <div className="mt-3">
                              {post.media.match(/\.(mp4|webm|mov)$/i) ? <CompactVideo src={post.media} /> : <img src={post.media} className="rounded-2xl border border-white/5 w-full max-h-[450px] object-cover" alt="" />}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-5 px-1 text-zinc-500">
                              <div className="flex gap-6">
                                <button onClick={() => handleLike(post._id)} className={`flex items-center gap-2 transition-all ${post.likes?.includes(user?.sub) ? 'text-rose-500' : 'hover:text-rose-500'}`}>
                                  {post.likes?.includes(user?.sub) ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
                                  <span className="text-[10px] font-black">{post.likes?.length || 0}</span>
                                </button>
                                <button onClick={() => setActiveCommentPost(post)} className="hover:text-cyan-400 flex items-center gap-2 transition-colors"><FaRegComment size={15} /><span className="text-[10px] font-black">{post.comments?.length || 0}</span></button>
                              </div>
                              <button onClick={() => navigator.share?.({url: window.location.href, title: 'OnyxDrift Sync'})} className="p-2 bg-zinc-900/40 rounded-lg hover:text-cyan-400"><FaShareAlt size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                </div>
            )}
          </>
        )}
        {activeTab === "market" && <Marketplace />}
        {activeTab === "notify" && <Notification />}
        {activeTab === "settings" && <Settings />}
      </section>

      {/* --- CREATE POST MODAL --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-[#080808] border border-white/10 rounded-[32px] p-6 shadow-2xl">
              <div className={`absolute top-0 left-0 w-full h-1 transition-all ${isEncrypted ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-zinc-800'}`} />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-cyan-500 font-black text-[9px] uppercase tracking-widest">{isEncrypted ? "Secured Transmission" : "Global Uplink"}</h3>
                <button onClick={() => setIsPostModalOpen(false)} className="text-zinc-500 hover:text-white"><FaTimes /></button>
              </div>
              <textarea placeholder={isEncrypted ? "Encrypting node data..." : "Initiate drift..."} value={postText} onChange={(e) => setPostText(e.target.value)} className="w-full bg-transparent outline-none text-lg text-white resize-none min-h-[160px] placeholder-zinc-800 font-mono" />
              {mediaFile && <div className="relative mb-4 rounded-2xl overflow-hidden"><img src={URL.createObjectURL(mediaFile)} className="w-full h-40 object-cover" alt="" /><button onClick={() => setMediaFile(null)} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"><FaTimes size={10} /></button></div>}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex gap-5">
                  <input type="file" hidden ref={postMediaRef} onChange={(e) => setMediaFile(e.target.files[0])} accept="image/*,video/*" />
                  <button onClick={() => postMediaRef.current.click()} className="text-zinc-500 hover:text-cyan-500"><FaImage size={18} /></button>
                  <button onClick={() => setIsEncrypted(!isEncrypted)} className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase transition-all ${isEncrypted ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-white/10 text-zinc-600'}`}>
                    {isEncrypted ? <FaFingerprint size={12}/> : <FaUnlock size={10}/>} {isEncrypted ? "Encrypted" : "Public"}
                  </button>
                </div>
                <button disabled={isSubmitting || (!postText && !mediaFile)} onClick={handlePostSubmit} className={`px-8 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isSubmitting ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}>
                  {isSubmitting ? "Linking..." : "Transmit"}
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
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0A0A0A] rounded-t-[32px] border-t border-white/10 h-[75vh] flex flex-col p-6 shadow-2xl">
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-cyan-500 font-black text-[9px] uppercase tracking-[0.2em]">Resonance Strings</h3>
                <button onClick={() => setActiveCommentPost(null)} className="text-zinc-600 hover:text-white"><FaTimes /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar text-left">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-8 h-8 rounded-xl border border-white/5" alt="" />
                    <div className="bg-white/[0.03] p-3 rounded-2xl flex-1 border border-white/5">
                      <p className="text-cyan-500 font-bold text-[10px] uppercase">{c.userName}</p>
                      <p className="text-[12px] text-gray-400 mt-1">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()} placeholder="Add to sync..." className="flex-1 bg-transparent outline-none text-[11px] text-gray-200 px-2" />
                <button onClick={handleCommentSubmit} className="bg-cyan-500 text-black p-2.5 rounded-xl"><FaPaperPlane size={12}/></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setIsPostModalOpen(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] z-[100]">
        <FaBolt size={22} />
      </motion.button>
    </div>
  );
};

export default PremiumHomeFeed;