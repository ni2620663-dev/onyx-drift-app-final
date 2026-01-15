import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, 
  FaShareAlt, FaDownload, FaEllipsisH, FaCheckCircle,
  FaVolumeMute, FaVolumeUp, FaTrashAlt, FaUser, FaCog, FaSignOutAlt
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

// --- Video Component with Sound Toggle ---
const AutoPlayVideo = ({ src }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }, { threshold: 0.5 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [src]);

  const toggleSound = (e) => {
    e.stopPropagation();
    const nextMuteState = !isMuted;
    videoRef.current.muted = nextMuteState;
    setIsMuted(nextMuteState);
  };

  return (
    <div className="relative group">
      <video 
        ref={videoRef} 
        src={src} 
        muted={isMuted}
        loop 
        playsInline 
        className="w-full h-auto max-h-[500px] object-contain rounded-xl bg-black shadow-inner" 
      />
      <button 
        onClick={toggleSound}
        className="absolute bottom-4 right-4 p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-cyan-500 hover:scale-110 transition-all z-10 shadow-lg"
      >
        {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
      </button>
    </div>
  );
};

const PremiumHomeFeed = ({ searchQuery = "", isPostModalOpen, setIsPostModalOpen }) => {
  const { user, logout, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postText, setPostText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [activeProfileMenuId, setActiveProfileMenuId] = useState(null);

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
    const closeAllMenus = () => {
      setActivePostMenuId(null);
      setActiveProfileMenuId(null);
    };
    window.addEventListener('click', closeAllMenus);
    return () => window.removeEventListener('click', closeAllMenus);
  }, []);

  // --- Like Logic Fixed ---
  const handleLike = async (e, postId) => {
    e.stopPropagation(); // Prevents clicking other elements
    if (!isAuthenticated) return alert("Please login to like");
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the specific post in the state
      setPosts(posts.map(p => p._id === postId ? response.data : p));
    } catch (err) { 
      console.error("Like Error:", err.response?.data || err.message);
    }
  };

  const handleShare = (e, post) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: 'Onyx Drift', text: post.text, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      setPostText(""); setMediaFile(null); setMediaPreview(null);
      setIsPostModalOpen(false); fetchPosts();
    } catch (err) { alert("Transmission failed."); } finally { setIsSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this broadcast?")) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) { alert("Deletion failed."); }
  };

  return (
    <div className="w-full min-h-screen bg-[#02040a] text-white pt-2 pb-32 overflow-x-hidden font-sans">
      
      {/* --- HEADER (Cleaned as per red marks) --- */}
      <div className="max-w-[550px] mx-auto px-4 flex justify-between items-center py-6 sticky top-0 bg-[#02040a]/80 backdrop-blur-md z-[100]">
          <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-100">Onyx Drift</h2>
          </div>
          {/* Settings icon removed from here */}
      </div>

      <section className="max-w-[550px] mx-auto px-4">
        {error && <div className="p-3 mb-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-cyan-400 text-[10px] uppercase text-center animate-pulse">{error}</div>}

        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => {
              const mediaSrc = post.media || post.mediaUrl;
              const isVideo = mediaSrc?.match(/\.(mp4|webm|mov)$/i) || post.mediaType === 'video';
              const isLiked = post.likes?.includes(user?.sub);
              
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={post._id} className="flex gap-3 py-6 border-b border-white/5 relative">
                  
                  {/* Avatar & Profile Menu */}
                  <div className="relative flex-shrink-0">
                    <img 
                      onClick={(e) => { e.stopPropagation(); setActiveProfileMenuId(activeProfileMenuId === post._id ? null : post._id); }}
                      src={post.authorAvatar || post.authorPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
                      className="w-11 h-11 rounded-full border border-white/10 object-cover bg-gray-900 cursor-pointer hover:border-cyan-500/50 transition-all" 
                      alt="avatar" 
                    />

                    <AnimatePresence>
                      {activeProfileMenuId === post._id && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute left-0 mt-2 w-48 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-[150] p-2 backdrop-blur-xl">
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors">
                            <FaUser size={14} className="text-cyan-500" /> Profile
                          </button>
                          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl transition-colors">
                            <FaCog size={14} className="text-gray-400" /> Settings
                          </button>
                          <div className="my-1 border-t border-white/5" />
                          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/5 rounded-xl transition-colors">
                            <FaSignOutAlt size={14} /> Log Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden group">
                        <span className="text-[15px] font-bold text-gray-100 truncate">{post.authorName || 'Drifter'}</span>
                        <FaCheckCircle className="text-cyan-500 text-[11px] flex-shrink-0" />
                        <span className="text-gray-600 text-[13px]">· {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Now'}</span>
                      </div>
                      
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActivePostMenuId(activePostMenuId === post._id ? null : post._id); }} className="p-2 text-gray-600 hover:text-rose-500 rounded-full hover:bg-white/5 transition-colors">
                          <FaEllipsisH size={14} />
                        </button>
                        <AnimatePresence>
                          {activePostMenuId === post._id && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-2 w-40 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 backdrop-blur-xl">
                              <button onClick={() => handleDeletePost(post._id)} className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-3 transition-colors">
                                <FaTrashAlt size={12} /> Delete Post
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <p className="text-[15px] text-gray-200 leading-normal mt-1 mb-3 whitespace-pre-wrap">{post.text}</p>

                    {mediaSrc && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                        {isVideo ? <AutoPlayVideo src={mediaSrc} /> : <img src={mediaSrc} className="w-full h-auto object-cover max-h-[550px]" alt="post-media" loading="lazy" />}
                      </div>
                    )}

                    {/* --- Action Buttons (Like & Comment Fixed) --- */}
                    <div className="flex justify-between mt-4 max-w-[420px] text-gray-500">
                      <button className="flex items-center gap-2 hover:text-cyan-400 group transition-colors">
                        <div className="p-2 group-hover:bg-cyan-500/10 rounded-full"><FaComment size={16}/></div>
                        <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                      </button>

                      <button 
                        onClick={(e) => handleLike(e, post._id)} 
                        className={`flex items-center gap-2 transition-all group ${isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                      >
                        <div className={`p-2 rounded-full ${isLiked ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
                           <FaHeart size={16} className={isLiked ? "fill-current" : ""} />
                        </div>
                        <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                      </button>

                      <button className="p-2 hover:text-green-500 hover:bg-green-500/10 rounded-full transition-colors"><FaDownload size={15}/></button>
                      
                      <button 
                        onClick={(e) => handleShare(e, post)} 
                        className="p-2 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full transition-colors"
                      >
                        <FaShareAlt size={15}/>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Transmit Signal Modal --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-start sm:items-center justify-center pt-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#0d1117] rounded-2xl border border-white/10 shadow-2xl mx-4 overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setIsPostModalOpen(false)} className="text-gray-400 hover:text-white p-2"><FaTimes size={18}/></button>
                  <button disabled={isSubmitting || (!postText.trim() && !mediaFile)} onClick={handlePostSubmit} className="bg-cyan-500 text-white px-6 py-1.5 rounded-full text-[14px] font-bold disabled:opacity-40 hover:bg-cyan-400 transition-all">
                    {isSubmitting ? "Syncing..." : "Transmit"}
                  </button>
                </div>
                <div className="flex gap-3">
                  <img src={user?.picture} className="w-10 h-10 rounded-full border border-white/10" alt="me" />
                  <textarea autoFocus value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="What's happening?" className="w-full bg-transparent text-[19px] text-gray-100 placeholder-gray-600 outline-none resize-none min-h-[150px]" />
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                   <button onClick={() => postMediaRef.current.click()} className="text-cyan-500 hover:bg-cyan-500/10 p-2.5 rounded-full transition-colors"><FaImage size={22} /></button>
                   <input type="file" ref={postMediaRef} onChange={(e) => setMediaFile(e.target.files[0])} hidden accept="image/*,video/*" />
                   <span className="text-[11px] font-mono text-gray-600">{postText.length} / 280</span>
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