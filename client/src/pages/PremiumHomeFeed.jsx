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
import Profile from "./Profile"; // Profile import kora hoyeche

// --- ১. NEURAL INPUT COMPONENT ---
const NeuralInput = ({ onPostSuccess }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [text, setText] = useState("");
  const [status, setStatus] = useState("IDLE");

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setStatus("SYNCING");
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post('https://onyx-drift-app-final-u29m.onrender.com/api/posts/neural-generate', {
        text,
        auth0Id: user?.sub,
        mood: "creative"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setStatus("SUCCESS");
        setTimeout(() => {
            setStatus("IDLE");
            setText("");
            if (onPostSuccess) onPostSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error("Neural Sync Failed", err);
      setStatus("IDLE");
    }
  };

  return (
    <motion.div 
      animate={status === "SYNCING" ? { x: [0, -2, 2, 0] } : {}}
      className="bg-[#080808] border border-cyan-500/20 p-5 rounded-[24px] mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] group relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3 relative z-10">
         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
         <h3 className="text-cyan-500 font-mono text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
            <FaBrain /> Neural_Input_Core_v2
         </h3>
      </div>
      <textarea 
        className="w-full bg-transparent border-none outline-none text-gray-200 font-mono text-sm placeholder-zinc-700 resize-none min-h-[80px]"
        placeholder="Type a thought to synthesize..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-3">
        <button 
          onClick={handleGenerate}
          disabled={status === "SYNCING"}
          className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all"
        >
          {status === "SYNCING" ? "Syncing..." : "Execute"}
        </button>
      </div>
    </motion.div>
  );
};

// --- ২. ভিডিও কম্পোনেন্ট ---
const CompactVideo = ({ src }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const currentVideo = videoRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (currentVideo) {
        if (entry.isIntersecting) currentVideo.play().catch(() => {});
        else currentVideo.pause();
      }
    }, { threshold: 0.6 });
    if (currentVideo) observer.observe(currentVideo);
    return () => { if (currentVideo) observer.unobserve(currentVideo); };
  }, [src]);

  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black max-w-[400px]">
      <video ref={videoRef} src={src} muted={isMuted} loop playsInline className="w-full h-72 object-cover" />
      <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white">
        {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
      </button>
    </div>
  );
};

const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
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
  const [userProfile, setUserProfile] = useState(null);

  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
  const postMediaRef = useRef(null);

  const fetchPosts = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${API_URL}/api/posts/neural-feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err) { 
      console.error("Fetch Error:", err);
      try {
        const fallback = await axios.get(`${API_URL}/api/posts`);
        setPosts(Array.isArray(fallback.data) ? fallback.data : []);
      } catch (e) { setPosts([]); }
    } finally { setLoading(false); }
  };

  const fetchUserProfile = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(res.data);
    } catch (err) { 
        console.error("Profile Error:", err);
        setUserProfile({}); // Error handling
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    let list = [...posts];
    if (activeFilter === "Resonance") return list.sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0));
    if (activeFilter === "Encrypted") return list.filter(p => p.isEncrypted);
    return list;
  }, [posts, activeFilter]);

  const handleLike = async (postId) => {
    if (!user?.sub) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchPosts();
    } catch (err) { console.error(err); }
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
      
      await axios.post(`${API_URL}/api/posts`, formData, { 
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        } 
      });
      setPostText(""); setMediaFile(null); setIsPostModalOpen(false);
      fetchPosts();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleCommentSubmit = async () => {
    if(!commentText.trim() || !activeCommentPost) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, { 
        text: commentText 
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.map(p => p._id === activeCommentPost._id ? res.data : p));
      setActiveCommentPost(res.data); setCommentText("");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer object-cover" 
            onClick={() => setIsSideMenuOpen(true)} 
            alt="profile" 
          />
          <h2 className="text-lg font-black italic text-cyan-500 uppercase">OnyxDrift</h2>
        </div>
        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
          <FaBolt className="text-cyan-500 text-[10px]" />
          <span className="text-[10px] font-mono text-cyan-200">{userProfile?.neuralRank ?? 0}</span>
        </div>
      </header>

      {/* SIDE MENU */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSideMenuOpen(false)} className="fixed inset-0 bg-black/70 z-[200]" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-[280px] bg-[#050505] border-r border-cyan-500/10 z-[201] p-6 shadow-2xl">
               
               <div 
                className="mb-10 group cursor-pointer"
                onClick={() => {
                  navigate(`/profile/${user?.sub}`);
                  setIsSideMenuOpen(false);
                }}
               >
                  <div className="relative w-16 h-16 mb-4">
                    <img src={user?.picture} className="w-full h-full rounded-2xl border-2 border-cyan-500/20 object-cover" alt="user" />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 p-1 rounded-lg text-[8px] text-black font-black uppercase">Level {userProfile?.neuralRank ?? 1}</div>
                  </div>
                  <h4 className="font-black text-gray-100 text-lg uppercase tracking-tighter">{userProfile?.nickname || user?.nickname || "Syncing..."}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[9px] text-cyan-500 font-mono font-bold uppercase tracking-[2px]">Neural Link: ACTIVE</p>
                  </div>
               </div>

               <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                  <p className="text-[10px] text-zinc-500 uppercase font-black">Neural Impact</p>
                  <p className="text-xl font-black text-cyan-400">
                    {userProfile?.stats?.neuralImpact ?? 0} 
                  </p>
               </div>

               <nav className="flex flex-col gap-2">
                 {[
                   { icon: <FaHome />, label: 'Neural Feed', tab: 'home' }, 
                   { icon: <FaStore />, label: 'Marketplace', tab: 'market' }, 
                   { icon: <FaCog />, label: 'Settings', tab: 'settings' }
                 ].map((item, i) => (
                   <div key={i} onClick={() => { setActiveTab(item.tab); setIsSideMenuOpen(false); }} className={`flex items-center gap-4 p-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === item.tab ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                     {item.icon} {item.label}
                   </div>
                 ))}
               </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen">
        {activeTab === "home" && (
          <>
            <div className="flex justify-center gap-2 py-4 border-b border-white/5 sticky top-14 bg-black/50 backdrop-blur-md z-50">
              {['Global', 'Encrypted', 'Resonance'].map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeFilter === f ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-zinc-500 border-white/5'}`}>{f}</button>
              ))}
            </div>

            <div className="px-5 pt-6">
                <NeuralInput onPostSuccess={fetchPosts} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="divide-y divide-white/5">
                  {filteredPosts.map((post) => (
                    <div key={post._id} className="p-5 hover:bg-white/[0.01] transition-all">
                      <div className="flex gap-3">
                        <img 
                          src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}`} 
                          className="w-11 h-11 rounded-2xl border border-white/10 object-cover cursor-pointer" 
                          onClick={() => navigate(`/profile/${post.authorId || post.userId}`)}
                          alt="avatar" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-[11px] uppercase tracking-wide text-gray-200">{post.authorName}</span>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase">{new Date(post.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[13px] leading-relaxed text-gray-400">{post.text}</p>
                          {post.media && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-white/5">
                              {post.media.match(/\.(mp4|webm|mov)$/i) ? <CompactVideo src={post.media} /> : <img src={post.media} className="w-full max-h-[450px] object-cover" alt="media" />}
                            </div>
                          )}
                          <div className="flex items-center gap-6 mt-5 text-zinc-500">
                                <button onClick={() => handleLike(post._id)} className={`flex items-center gap-2 ${post.likes?.includes(user?.sub) ? 'text-rose-500' : ''}`}>
                                  {post.likes?.includes(user?.sub) ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                                  <span className="text-[10px] font-black">{post.likes?.length || 0}</span>
                                </button>
                                <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-2 hover:text-cyan-400">
                                  <FaRegComment size={14} />
                                  <span className="text-[10px] font-black">{post.comments?.length || 0}</span>
                                </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </>
        )}
        {activeTab === "market" && <Marketplace />}
        {activeTab === "settings" && <Settings />}
      </main>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg bg-[#080808] border border-cyan-500/20 rounded-[32px] p-8 shadow-2xl">
              <textarea 
                placeholder="Broadcast your thoughts..." 
                value={postText} 
                onChange={(e) => setPostText(e.target.value)} 
                className="w-full bg-transparent outline-none text-lg text-white resize-none min-h-[150px]" 
              />
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <input type="file" hidden ref={postMediaRef} onChange={(e) => setMediaFile(e.target.files[0])} />
                <button onClick={() => postMediaRef.current.click()} className="text-zinc-500 hover:text-cyan-500 transition-colors"><FaImage size={20} /></button>
                <button 
                  disabled={isSubmitting || (!postText && !mediaFile)} 
                  onClick={handlePostSubmit} 
                  className="px-10 py-3 rounded-2xl font-black text-[11px] uppercase bg-cyan-500 text-black shadow-lg"
                >
                  {isSubmitting ? "SYNCING..." : "TRANSMIT"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMENT MODAL */}
      <AnimatePresence>
        {activeCommentPost && (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPost(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0A0A0A] rounded-t-[40px] border-t border-white/10 h-[80vh] flex flex-col p-8">
              <div className="flex-1 overflow-y-auto space-y-5 no-scrollbar">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-9 h-9 rounded-2xl object-cover" alt="avatar" />
                    <div className="bg-white/5 p-4 rounded-3xl flex-1">
                      <p className="text-cyan-500 font-black text-[10px] uppercase">{c.userName}</p>
                      <p className="text-[13px] text-gray-300">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3 bg-zinc-900 p-3 rounded-3xl border border-white/10">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()} 
                  placeholder="Inject resonance..." 
                  className="flex-1 bg-transparent outline-none text-white px-3 font-mono" 
                />
                <button onClick={handleCommentSubmit} className="bg-cyan-500 text-black p-3 rounded-2xl"><FaPaperPlane size={14}/></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => setIsPostModalOpen(true)} className="fixed bottom-24 right-6 w-16 h-16 bg-cyan-500 text-black rounded-3xl flex items-center justify-center shadow-lg z-[100]">
        <FaBolt size={24} />
      </motion.button>
      
    </div>
  );
};

export default PremiumHomeFeed;