import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, 
  FaShareAlt, FaEllipsisH, FaCheckCircle,
  FaVolumeMute, FaVolumeUp, FaTrashAlt, FaEnvelope, FaPaperPlane, FaBolt, FaRegHeart, FaRegComment
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// --- মিনিমালিস্টিক ভিডিও প্লেয়ার ---
const AutoPlayVideo = ({ src }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const currentVideo = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (currentVideo && entry.isIntersecting) {
          currentVideo.play().catch(() => {});
        } else if (currentVideo) {
          currentVideo.pause();
        }
      }, { threshold: 0.5 }
    );
    if (currentVideo) observer.observe(currentVideo);
    return () => { if (currentVideo) observer.unobserve(currentVideo); };
  }, [src]);

  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-zinc-800 bg-black">
      <video 
        ref={videoRef} src={src} muted={isMuted} loop playsInline 
        className="w-full h-auto max-h-[512px] object-contain" 
      />
      <button 
        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
        className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white/80"
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

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete post?")) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) { alert("Failed"); }
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

  return (
    <div className="w-full min-h-screen bg-black text-white pb-20 font-sans">
      
      {/* --- X Style Header --- */}
      <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-[600px] mx-auto px-4 h-14 flex justify-between items-center">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-zinc-800 cursor-pointer" 
            alt="me" 
            onClick={() => navigate(`/profile/${user?.sub}`)}
          />
          <h2 className="text-lg font-bold tracking-tighter italic text-cyan-500">OnyxDrift</h2>
          <button className="text-zinc-400 hover:text-white"><FaBolt size={16} /></button>
        </div>
      </div>

      {/* --- Feed Section --- */}
      <section className="max-w-[600px] mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {posts.map((post) => {
              const isLiked = post.likes?.includes(user?.sub);
              const mediaSrc = post.media || post.mediaUrl;
              const isVideo = mediaSrc?.match(/\.(mp4|webm|mov)$/i);

              return (
                <div key={post._id} className="p-4 hover:bg-zinc-900/30 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <img src={post.authorAvatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[15px] truncate">{post.authorName}</span>
                          <FaCheckCircle className="text-cyan-500 text-[12px]" />
                          <span className="text-zinc-500 text-[14px]">@{post.authorName?.toLowerCase().replace(/\s/g, '')}</span>
                        </div>
                        <div className="relative">
                           <button onClick={(e) => { e.stopPropagation(); setActivePostMenuId(activePostMenuId === post._id ? null : post._id); }} className="text-zinc-500 hover:text-cyan-500"><FaEllipsisH size={14} /></button>
                           {activePostMenuId === post._id && (
                             <div className="absolute right-0 mt-2 w-32 bg-black border border-zinc-800 rounded-lg shadow-xl z-10">
                               <button onClick={() => handleDeletePost(post._id)} className="w-full text-left p-3 text-rose-500 text-xs font-bold uppercase">Delete</button>
                             </div>
                           )}
                        </div>
                      </div>

                      <p className="text-[15px] text-zinc-200 mt-1 leading-normal whitespace-pre-wrap">{post.text}</p>
                      
                      {mediaSrc && (
                        isVideo ? <AutoPlayVideo src={mediaSrc} /> : <img src={mediaSrc} className="mt-3 rounded-2xl border border-zinc-800 w-full object-cover max-h-[500px]" alt="post" />
                      )}

                      <div className="flex justify-between mt-4 max-w-md text-zinc-500">
                        <button onClick={(e) => { e.stopPropagation(); setActiveCommentPost(post); }} className="flex items-center gap-2 hover:text-cyan-500 transition-colors">
                          <FaRegComment size={16} /> <span className="text-xs">{post.comments?.length || 0}</span>
                        </button>
                        <button onClick={(e) => handleLike(e, post._id)} className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
                          {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />} <span className="text-xs">{post.likes?.length || 0}</span>
                        </button>
                        <button className="hover:text-cyan-500"><FaShareAlt size={16} /></button>
                        <button className="hover:text-cyan-500"><FaEnvelope size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Floating Action Button (FAB) --- */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <FaBolt size={20} />
      </motion.button>

      {/* --- X Style Post Modal --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] bg-black sm:bg-zinc-900/40 sm:backdrop-blur-sm flex justify-center items-start sm:pt-10">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black w-full max-w-xl h-full sm:h-auto sm:rounded-2xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setIsPostModalOpen(false)} className="text-white"><FaTimes size={18} /></button>
                <button 
                  disabled={isSubmitting || !postText.trim()} 
                  onClick={handlePostSubmit}
                  className="bg-cyan-500 text-white px-5 py-1.5 rounded-full font-bold text-sm disabled:opacity-50"
                >
                  Post
                </button>
              </div>
              <div className="flex gap-3">
                <img src={user?.picture} className="w-10 h-10 rounded-full" alt="me" />
                <textarea 
                  autoFocus
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's happening?" 
                  className="w-full bg-transparent text-xl outline-none resize-none min-h-[150px]"
                />
              </div>
              <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
                <button onClick={() => postMediaRef.current.click()} className="text-cyan-500"><FaImage size={20} /></button>
                <input type="file" ref={postMediaRef} hidden onChange={(e) => setMediaFile(e.target.files[0])} />
                {mediaFile && <span className="text-[10px] text-cyan-500">File Selected</span>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PremiumHomeFeed;