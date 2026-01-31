import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, 
  FaShareAlt, FaEllipsisH, FaCheckCircle,
  FaVolumeMute, FaVolumeUp, FaTrashAlt, FaEnvelope, FaPaperPlane, FaBolt, FaRegHeart
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// --- কম্প্যাক্ট ভিডিও কম্পোনেন্ট (ক্লিক করলে রিলসে যাবে) ---
const CompactVideo = ({ src, onVideoClick }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const currentVideo = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (currentVideo && entry.isIntersecting) {
          currentVideo.play().catch(() => {});
        } else if (currentVideo) {
          currentVideo.pause();
        }
      }, { threshold: 0.6 }
    );
    if (currentVideo) observer.observe(currentVideo);
    return () => { if (currentVideo) observer.unobserve(currentVideo); };
  }, [src]);

  return (
    <div 
      onClick={onVideoClick}
      className="relative mt-3 rounded-2xl overflow-hidden border border-white/5 bg-black max-w-[400px] cursor-pointer"
    >
      <video 
        ref={videoRef} src={src} muted loop playsInline 
        className="w-full h-64 object-cover" 
      />
      <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
         <FaBolt className="text-cyan-500 text-2xl" />
      </div>
    </div>
  );
};

const PremiumHomeFeed = ({ searchQuery = "", isPostModalOpen, setIsPostModalOpen }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePostMenuId, setActivePostMenuId] = useState(null);
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
    <div className="w-full min-h-screen bg-[#02040a] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* --- X Style Header --- */}
      <div className="sticky top-0 z-50 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-white/10 cursor-pointer" 
            alt="me" 
            onClick={() => navigate(`/profile/${user?.sub}`)}
          />
          <h2 className="text-lg font-bold italic text-cyan-500 tracking-tighter">OnyxDrift</h2>
        </div>
        <button className="text-zinc-500 hover:text-cyan-500 transition-colors"><FaBolt size={16} /></button>
      </div>

      <section className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen">
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
                    {/* প্রোফাইল পিকচারে ক্লিক করলে আইডিতে যাবে */}
                    <img 
                      onClick={() => navigate(`/profile/${authorId}`)}
                      src={post.authorAvatar || post.authorPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
                      className="w-11 h-11 rounded-2xl object-cover bg-gray-900 border border-white/5 cursor-pointer hover:border-cyan-500/50 transition-all" 
                      alt="avatar" 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            {/* নামে ক্লিক করলে আইডিতে যাবে */}
                            <span 
                              onClick={() => navigate(`/profile/${authorId}`)}
                              className="font-bold text-[15px] hover:underline cursor-pointer text-gray-100"
                            >
                              {post.authorName || 'Drifter'}
                            </span>
                            <FaCheckCircle className="text-cyan-500 text-[10px]" />
                          </div>
                          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-tighter">ID_{authorId?.slice(-8).toUpperCase()}</span>
                        </div>
                        <button onClick={() => setActivePostMenuId(activePostMenuId === post._id ? null : post._id)} className="text-zinc-600 hover:text-white">
                          <FaEllipsisH size={12} />
                        </button>
                      </div>

                      <p className="text-[14px] text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed font-light">{post.text}</p>
                      
                      {mediaSrc && (
                        isVideo ? (
                          <CompactVideo src={mediaSrc} onVideoClick={() => navigate('/reels')} />
                        ) : (
                          <img 
                            onClick={() => setFullscreenImage(mediaSrc)}
                            src={mediaSrc} 
                            className="mt-3 rounded-2xl border border-white/5 w-full max-w-[480px] object-cover cursor-zoom-in hover:opacity-90 transition-opacity" 
                            alt="post" 
                          />
                        )
                      )}

                      {/* --- Interaction Buttons (আগের মতো প্রিমিয়াম স্টাইল) --- */}
                      <div className="flex gap-8 mt-5">
                        <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-2.5 text-zinc-500 hover:text-cyan-400 transition-all group">
                          <div className="p-2 bg-white/5 rounded-xl group-hover:bg-cyan-500/10"><FaComment size={14}/></div>
                          <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                        </button>

                        <button onClick={(e) => handleLike(e, post._id)} className={`flex items-center gap-2.5 transition-all group ${isLiked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}>
                          <div className={`p-2 rounded-xl transition-colors ${isLiked ? 'bg-rose-500/10' : 'bg-white/5 group-hover:bg-rose-500/10'}`}>
                            {isLiked ? <FaHeart size={14} className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> : <FaRegHeart size={14} />}
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

      {/* --- Fullscreen Photo Modal --- */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setFullscreenImage(null)} 
            className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={fullscreenImage} className="max-w-full max-h-full rounded-lg shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Floating Action Button --- */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-lg z-[100]"
      >
        <FaBolt size={20} />
      </motion.button>

    </div>
  );
};

export default PremiumHomeFeed;