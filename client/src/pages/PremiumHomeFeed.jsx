import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, 
  FaShareAlt, FaEllipsisH, FaCheckCircle,
  FaVolumeMute, FaVolumeUp, FaTrashAlt, FaEnvelope, FaPaperPlane, FaBolt
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// --- ফিউচারিস্টিক ভিডিও কম্পোনেন্ট ---
const AutoPlayVideo = ({ src }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const currentVideo = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (currentVideo) {
          if (entry.isIntersecting) {
            currentVideo.play().catch(() => {});
          } else {
            currentVideo.pause();
          }
        }
      }, { threshold: 0.5 }
    );
    if (currentVideo) observer.observe(currentVideo);
    return () => {
      if (currentVideo) observer.unobserve(currentVideo);
      observer.disconnect();
    };
  }, [src]);

  const toggleSound = (e) => {
    e.stopPropagation();
    const nextMuteState = !isMuted;
    if (videoRef.current) {
      videoRef.current.muted = nextMuteState;
      setIsMuted(nextMuteState);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl">
      <video 
        ref={videoRef} 
        src={src} 
        muted={isMuted}
        loop 
        playsInline 
        className="w-full h-auto max-h-[520px] object-contain bg-[#0a0a0c]" 
      />
      <button 
        type="button"
        onClick={toggleSound}
        className="absolute bottom-4 right-4 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white/80 hover:bg-cyan-500 hover:text-white transition-all z-10"
      >
        {isMuted ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
      </button>
    </div>
  );
};

const PremiumHomeFeed = ({ searchQuery = "", isPostModalOpen, setIsPostModalOpen }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postText, setPostText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const postMediaRef = useRef(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
      setError(null);
    } catch (err) { 
      setError("Syncing with Neural Network...");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    const closeAllMenus = () => setActivePostMenuId(null);
    window.addEventListener('click', closeAllMenus);
    return () => window.removeEventListener('click', closeAllMenus);
  }, []);

  const handleLike = async (e, postId) => {
    e.stopPropagation(); 
    if (!isAuthenticated) return alert("Login required.");
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.map(p => p._id === postId ? response.data : p));
    } catch (err) { console.error(err); }
  };

  const handleFollowUser = async (e, targetAuth0Id) => {
    e.stopPropagation();
    if (!isAuthenticated) return alert("Login required.");
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/user/follow/${encodeURIComponent(targetAuth0Id)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Neural link established!");
    } catch (err) { alert("Transmission failed."); }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("text", postText);
      if (mediaFile) formData.append("media", mediaFile);
      
      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        }
      });
      setPostText(""); setMediaFile(null);
      setIsPostModalOpen(false); fetchPosts();
    } catch (err) { alert("Broadcast failed."); } finally { setIsSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete broadcast?")) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) { alert("Deletion failed."); }
  };

  const filteredPosts = posts.filter(post => 
    post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#02040a] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* --- Cyber Header (শুধুমাত্র মেইন অ্যাপ হেডার) --- */}
      <div className="sticky top-0 z-50 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[550px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-200 italic">OnyxDrift</h2>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:block">Neural Feed</span>
             <img src={user?.picture} className="w-8 h-8 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer" alt="me" />
          </div>
        </div>
      </div>

      <section className="max-w-[550px] mx-auto px-4 mt-4">
        {error && <div className="p-3 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] uppercase text-center font-bold tracking-widest">{error}</div>}

        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const mediaSrc = post.media || post.mediaUrl;
              const isVideo = mediaSrc?.match(/\.(mp4|webm|mov)$/i) || post.mediaType === 'video';
              const isLiked = post.likes?.includes(user?.sub);
              const authorId = post.authorAuth0Id || post.userId;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  key={post._id} 
                  className="bg-[#0d1117]/40 border border-white/5 rounded-[28px] p-4 sm:p-5 relative group transition-all hover:bg-[#0d1117]/60"
                >
                  <div className="flex gap-4">
                    <img 
                      onClick={() => navigate(`/profile/${authorId}`)}
                      src={post.authorAvatar || post.authorPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
                      className="w-12 h-12 rounded-2xl object-cover bg-gray-900 border border-white/5 cursor-pointer hover:border-cyan-500/50 transition-all" 
                      alt="avatar" 
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span onClick={() => navigate(`/profile/${authorId}`)} className="text-[15px] font-bold text-gray-100 cursor-pointer hover:text-cyan-400 transition-colors">
                              {post.authorName || 'Drifter'}
                            </span>
                            <FaCheckCircle className="text-cyan-500 text-[10px]" />
                            {user?.sub !== authorId && (
                              <button onClick={(e) => handleFollowUser(e, authorId)} className="ml-2 text-[9px] font-black uppercase text-cyan-500/80 hover:text-cyan-400 transition-colors tracking-tighter">
                                + Follow
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] text-gray-600 font-mono mt-0.5 tracking-wider">ID_{authorId?.slice(-8).toUpperCase()}</span>
                        </div>

                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setActivePostMenuId(activePostMenuId === post._id ? null : post._id); }} className="p-2 text-gray-600 hover:text-white rounded-lg transition-colors">
                            <FaEllipsisH size={12} />
                          </button>
                          <AnimatePresence>
                            {activePostMenuId === post._id && (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-2 w-40 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 backdrop-blur-xl">
                                <button onClick={() => handleDeletePost(post._id)} className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-3 transition-colors font-bold uppercase tracking-wider">
                                  <FaTrashAlt size={10} /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <p className="text-[14px] text-gray-300 leading-relaxed mt-3 mb-4 whitespace-pre-wrap font-light tracking-wide">{post.text}</p>

                      {mediaSrc && (
                        <div className="rounded-[22px] overflow-hidden border border-white/5 bg-black/20">
                          {isVideo ? <AutoPlayVideo src={mediaSrc} /> : <img src={mediaSrc} className="w-full h-auto object-cover max-h-[500px]" alt="media" loading="lazy" />}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-5 pt-1">
                        <div className="flex gap-6 items-center">
                          <button onClick={(e) => { e.stopPropagation(); setActiveCommentPost(post); }} className="flex items-center gap-2.5 text-gray-500 hover:text-cyan-400 transition-all group">
                            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-cyan-500/10 transition-colors"><FaComment size={14}/></div>
                            <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                          </button>

                          <button onClick={(e) => handleLike(e, post._id)} className={`flex items-center gap-2.5 transition-all group ${isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}>
                            <div className={`p-2 rounded-xl transition-colors ${isLiked ? 'bg-rose-500/10' : 'bg-white/5 group-hover:bg-rose-500/10'}`}>
                              <FaHeart size={14} className={isLiked ? "fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : ""} />
                            </div>
                            <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/messenger/${encodeURIComponent(authorId)}`); }} className="p-2 text-gray-600 hover:text-cyan-400 transition-colors"><FaEnvelope size={14}/></button>
                          <button onClick={(e) => { e.stopPropagation(); if (navigator.share) navigator.share({url: window.location.href}); }} className="p-2 text-gray-600 hover:text-white transition-colors"><FaShareAlt size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Floating Action Button --- */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] z-[100]"
      >
        <FaBolt size={20} />
      </motion.button>

      {/* --- Comment Modal --- */}
      <AnimatePresence>
        {activeCommentPost && (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPost(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0d1117] rounded-t-[32px] border-t border-white/10 shadow-2xl overflow-hidden h-[85vh] flex flex-col">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Neural_Feedback</h3>
                  <button onClick={() => setActiveCommentPost(null)} className="p-2 bg-white/5 rounded-full hover:bg-rose-500/20 transition-colors"><FaTimes size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userName}`} className="w-8 h-8 rounded-xl bg-gray-800" alt="u" />
                    <div className="bg-white/[0.03] p-3.5 rounded-2xl flex-1 border border-white/5">
                      <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">{c.userName}</p>
                      <p className="text-sm text-gray-300 leading-relaxed font-light">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-white/5 bg-[#0d1117]">
                <div className="flex gap-3 items-center bg-white/5 rounded-2xl px-4 py-1.5 border border-white/10 focus-within:border-cyan-500/50 transition-all">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Transmit feedback..." className="bg-transparent flex-1 outline-none text-sm py-2 placeholder-gray-600" />
                  <button onClick={async () => {
                    if (!commentText.trim()) return;
                    try {
                      const token = await getAccessTokenSilently();
                      const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, { text: commentText }, { headers: { Authorization: `Bearer ${token}` } });
                      setPosts(posts.map(p => p._id === activeCommentPost._id ? res.data : p));
                      setActiveCommentPost(res.data); setCommentText("");
                    } catch (err) { alert("Failed."); }
                  }} className="text-cyan-500 p-2 hover:scale-110 transition-transform"><FaPaperPlane /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Transmit Post Modal --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-start sm:items-center justify-center pt-4 sm:pt-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl bg-[#0d1117] rounded-[32px] border border-white/10 shadow-2xl mx-4 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setIsPostModalOpen(false)} className="text-gray-500 hover:text-white p-2 transition-colors"><FaTimes size={18}/></button>
                  <button disabled={isSubmitting || (!postText.trim() && !mediaFile)} onClick={handlePostSubmit} className="bg-cyan-500 text-black px-8 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-cyan-400">
                    {isSubmitting ? "Syncing..." : "Transmit"}
                  </button>
                </div>
                <div className="flex gap-4">
                  <img src={user?.picture} className="w-12 h-12 rounded-2xl border border-white/10" alt="me" />
                  <textarea autoFocus value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="What's on your frequency?" className="w-full bg-transparent text-lg text-gray-100 placeholder-gray-700 outline-none resize-none min-h-[180px]" />
                </div>
                {mediaFile && <div className="mt-4 text-[10px] text-cyan-400 bg-cyan-400/10 p-3 rounded-xl border border-cyan-400/20 flex justify-between items-center uppercase font-bold tracking-widest"><span>File: {mediaFile.name}</span><FaTimes className="cursor-pointer" onClick={() => setMediaFile(null)} /></div>}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <button onClick={() => postMediaRef.current.click()} className="text-cyan-500 bg-cyan-500/10 p-3 rounded-xl hover:bg-cyan-500/20 transition-all"><FaImage size={20} /></button>
                    <input type="file" ref={postMediaRef} onChange={(e) => setMediaFile(e.target.files[0])} hidden accept="image/*,video/*" />
                    <span className="text-[10px] font-mono text-gray-600 tracking-tighter">{postText.length} / 280 UNITS</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;