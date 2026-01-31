import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, 
  FaShareAlt, FaEllipsisH, FaCheckCircle,
  FaTrashAlt, FaEnvelope, FaPaperPlane, FaBolt, FaRegHeart, FaRegComment
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// --- ভিডিও কম্পোনেন্ট (রিলস নেভিগেশনসহ) ---
const CompactVideo = ({ src, onVideoClick }) => {
  const videoRef = useRef(null);
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
    <div onClick={onVideoClick} className="relative mt-3 rounded-2xl overflow-hidden border border-white/5 bg-black max-w-[400px] cursor-pointer">
      <video ref={videoRef} src={src} muted loop playsInline className="w-full h-64 object-cover" />
    </div>
  );
};

const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  
  // States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); // বোল্ট বাটনের জন্য
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const postMediaRef = useRef(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
    } catch (err) { console.error("Sync Error"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.map(p => p._id === postId ? response.data : p));
    } catch (err) { console.error(err); }
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
      setPostText(""); setMediaFile(null); setIsPostModalOpen(false); fetchPosts();
    } catch (err) { alert("Failed"); } finally { setIsSubmitting(false); }
  };

  const filteredPosts = posts.filter(post => 
    post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      
      {/* --- CLEAN HEADER (ডাবল বার ডিলিট করা হয়েছে) --- */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-white/10 cursor-pointer" 
            alt="me" 
            onClick={() => navigate(`/profile/${user?.sub}`)}
          />
          <h2 className="text-lg font-bold italic text-cyan-500 tracking-tighter">OnyxDrift</h2>
        </div>
        <div className="flex gap-4 items-center">
            <FaEnvelope className="text-zinc-500 cursor-pointer hover:text-white" onClick={() => navigate('/messenger')} />
            <FaBolt className="text-cyan-500 animate-pulse" />
        </div>
      </div>

      <section className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen bg-black">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredPosts.map((post) => {
              const isLiked = post.likes?.includes(user?.sub);
              const authorId = post.authorAuth0Id || post.userId;
              const mediaSrc = post.media || post.mediaUrl;
              const isVideo = mediaSrc?.match(/\.(mp4|webm|mov)$/i);

              return (
                <div key={post._id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex gap-3">
                    <img 
                      onClick={() => navigate(`/profile/${authorId}`)}
                      src={post.authorAvatar || post.authorPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
                      className="w-11 h-11 rounded-2xl object-cover bg-gray-900 border border-white/5 cursor-pointer" 
                      alt="avatar" 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span onClick={() => navigate(`/profile/${authorId}`)} className="font-bold text-[15px] hover:underline cursor-pointer text-gray-100">{post.authorName}</span>
                            <FaCheckCircle className="text-cyan-500 text-[10px]" />
                          </div>
                          <span className="text-[9px] text-zinc-600 font-mono">ID_{authorId?.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>

                      <p className="text-[14px] text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                      
                      {mediaSrc && (
                        isVideo ? (
                          <CompactVideo src={mediaSrc} onVideoClick={() => navigate('/reels')} />
                        ) : (
                          <img 
                            onClick={() => setFullscreenImage(mediaSrc)}
                            src={mediaSrc} 
                            className="mt-3 rounded-2xl border border-white/5 w-full max-w-[480px] object-cover cursor-zoom-in" 
                            alt="post" 
                          />
                        )
                      )}

                      {/* --- Interaction Buttons --- */}
                      <div className="flex gap-8 mt-5">
                        <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-2.5 text-zinc-500 hover:text-cyan-400 group">
                          <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-cyan-500/10 transition-colors"><FaRegComment size={14}/></div>
                          <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                        </button>

                        <button onClick={(e) => handleLike(e, post._id)} className={`flex items-center gap-2.5 transition-all group ${isLiked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}>
                          <div className={`p-2 rounded-xl transition-colors ${isLiked ? 'bg-rose-500/10' : 'bg-zinc-900 group-hover:bg-rose-500/10'}`}>
                            {isLiked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                          </div>
                          <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- BLUE BOLT BUTTON (আপনার রেড মার্ক করা বাটন) --- */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] z-[100]"
      >
        <FaBolt size={20} />
      </motion.button>

      {/* --- POST UPLOAD MODAL (Text, Photo, Video) --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-[#0d1117] rounded-[32px] border border-white/10 p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setIsPostModalOpen(false)} className="text-gray-500 hover:text-white p-2"><FaTimes size={18}/></button>
                <button 
                  disabled={isSubmitting || (!postText.trim() && !mediaFile)} 
                  onClick={handlePostSubmit} 
                  className="bg-cyan-500 text-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30"
                >
                  {isSubmitting ? "Uploading..." : "Post Now"}
                </button>
              </div>
              <div className="flex gap-4">
                <img src={user?.picture} className="w-12 h-12 rounded-2xl" alt="me" />
                <textarea 
                  autoFocus 
                  value={postText} 
                  onChange={(e) => setPostText(e.target.value)} 
                  placeholder="Share text, photo or video..." 
                  className="w-full bg-transparent text-lg text-gray-100 outline-none resize-none min-h-[150px]" 
                />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                <button onClick={() => postMediaRef.current.click()} className="text-cyan-500 bg-cyan-500/10 p-3 rounded-xl hover:bg-cyan-500/20 transition-all">
                  <FaImage size={20} />
                </button>
                <input type="file" ref={postMediaRef} onChange={(e) => setMediaFile(e.target.files[0])} hidden accept="image/*,video/*" />
                {mediaFile && <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Selected: {mediaFile.name.slice(0,15)}...</span>}
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
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0d1117] rounded-t-[32px] border-t border-white/10 h-[70vh] flex flex-col p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-cyan-500 font-bold text-xs uppercase tracking-widest">Comments</h3>
                <button onClick={() => setActiveCommentPost(null)}><FaTimes /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-2xl">
                    <div className="text-xs text-gray-300">
                      <p className="text-cyan-500 font-bold mb-1">{c.userName}</p>
                      <p>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm focus:border-cyan-500" />
                <button onClick={async () => {
                  if(!commentText.trim()) return;
                  const token = await getAccessTokenSilently();
                  const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, { text: commentText }, { headers: { Authorization: `Bearer ${token}` } });
                  setPosts(posts.map(p => p._id === activeCommentPost._id ? res.data : p));
                  setActiveCommentPost(res.data); setCommentText("");
                }} className="bg-cyan-500 text-black p-3 rounded-xl"><FaPaperPlane size={14}/></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFullscreenImage(null)} className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center p-4">
            <img src={fullscreenImage} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;