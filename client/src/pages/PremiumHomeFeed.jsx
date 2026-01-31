import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, FaShareAlt, FaCheckCircle, 
  FaBolt, FaRegHeart, FaRegComment, FaVolumeUp, FaVolumeMute, FaEye, 
  FaPaperPlane, FaSearch, FaRegBell, FaUserCircle, FaEnvelope, FaHome
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

// --- উন্নত ভিডিও কম্পোনেন্ট ---
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

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  return (
    <div onClick={onVideoClick} className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black max-w-[400px] cursor-pointer group">
      <video ref={videoRef} src={src} muted={isMuted} loop playsInline className="w-full h-72 object-cover" />
      <button onClick={toggleMute} className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 z-10 hover:scale-110 transition-all">
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
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
    } catch (err) { console.error("Fetch Error"); } finally { setLoading(false); }
  };

  // --- LIKE FUNCTION (Optimized) ---
  const handleLike = async (postId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.map(p => p._id === postId ? res.data : p));
    } catch (err) { 
        console.error("Like Error: Backend may not be handling 'likes' array properly.");
    }
  };

  // --- POST CREATE FUNCTION ---
  const handleCreatePost = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("text", postText);
      if (mediaFile) formData.append("media", mediaFile);

      const res = await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
      });

      setPosts([res.data, ...posts]);
      setPostText("");
      setMediaFile(null);
      setIsPostModalOpen(false);
    } catch (err) { 
        alert("Post failed. Check server connection.");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer" 
            alt="profile" 
            onClick={() => setIsSideMenuOpen(true)} 
          />
          <h2 className="text-lg font-bold italic text-cyan-500 tracking-tighter">OnyxDrift</h2>
        </div>
        <div className="flex gap-4 items-center">
            <FaEnvelope className="text-zinc-500 cursor-pointer hover:text-white" onClick={() => navigate('/messenger')} />
            <FaBolt className="text-cyan-500 animate-pulse" />
        </div>
      </div>

      {/* --- FEED SECTION --- */}
      <section className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {posts.map((post) => (
              <div key={post._id} className="p-4 hover:bg-white/[0.01] transition-all">
                <div className="flex gap-3">
                  <img src={post.authorAvatar} className="w-11 h-11 rounded-2xl border border-white/10 object-cover" alt="" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[14px] text-gray-200">{post.authorName}</span>
                      <FaCheckCircle className="text-cyan-500 text-[10px]" />
                    </div>
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">{post.text}</p>
                    {post.media && (
                      post.media.match(/\.(mp4|webm|mov)$/i) ? 
                      <CompactVideo src={post.media} /> : 
                      <img src={post.media} className="mt-3 rounded-2xl border border-white/5 w-full object-cover" alt="" />
                    )}
                    <div className="flex items-center justify-between mt-5 px-1 text-zinc-500">
                      <div className="flex gap-6">
                        <button onClick={() => handleLike(post._id)} className="flex items-center gap-2 hover:text-rose-500">
                           {post.likes?.includes(user?.sub) ? <FaHeart className="text-rose-500" /> : <FaRegHeart />} 
                           <span className="text-[11px] font-bold">{post.likes?.length || 0}</span>
                        </button>
                        <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-2 hover:text-cyan-400">
                           <FaRegComment size={16} /> <span className="text-[11px] font-bold">{post.comments?.length || 0}</span>
                        </button>
                      </div>
                      <button onClick={() => navigator.share({url: window.location.href})} className="p-2 hover:text-cyan-400">
                         <FaShareAlt size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- CREATE POST MODAL (Fix for Blue Bar) --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-cyan-500 font-bold uppercase tracking-widest text-xs">New Pulse</h3>
                <FaTimes onClick={() => setIsPostModalOpen(false)} className="text-zinc-500 cursor-pointer" />
              </div>
              <textarea 
                value={postText} 
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Synchronize with the drift..."
                className="w-full bg-transparent border-none outline-none text-gray-200 resize-none h-32 text-lg"
              />
              {mediaFile && (
                <div className="relative mb-4 rounded-xl overflow-hidden border border-white/10 h-24 w-24">
                    <img src={URL.createObjectURL(mediaFile)} className="object-cover h-full w-full" alt="preview" />
                    <button onClick={() => setMediaFile(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"><FaTimes size={10}/></button>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <FaImage onClick={() => fileInputRef.current.click()} className="text-zinc-500 cursor-pointer hover:text-cyan-400 text-xl" />
                <input type="file" ref={fileInputRef} hidden onChange={(e) => setMediaFile(e.target.files[0])} accept="image/*,video/*" />
                <button 
                  onClick={handleCreatePost}
                  disabled={isSubmitting}
                  className="bg-cyan-500 text-black px-6 py-2 rounded-full font-black text-sm uppercase disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Post"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FIXED BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-lg border-t border-white/5 h-16 flex justify-around items-center px-6 z-[200]">
        <FaHome className="text-cyan-500 text-xl cursor-pointer" onClick={() => navigate('/feed')} />
        <FaSearch className="text-zinc-500 text-xl cursor-pointer" onClick={() => navigate('/search')} />
        <div className="bg-white text-black p-3 rounded-xl -mt-8 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer hover:scale-110 transition-all" onClick={() => setIsPostModalOpen(true)}>
          <FaBolt />
        </div>
        <FaRegBell className="text-zinc-500 text-xl cursor-pointer" onClick={() => navigate('/notifications')} />
        <FaUserCircle className="text-zinc-500 text-xl cursor-pointer" onClick={() => navigate(`/profile/${user?.sub}`)} />
      </div>

      {/* Comment Section (Modal) */}
      <AnimatePresence>
        {activeCommentPost && (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPost(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0A0A0A] rounded-t-[32px] border-t border-white/10 h-[70vh] flex flex-col p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.2em]">Signal Comments</h3>
                <button onClick={() => setActiveCommentPost(null)} className="text-zinc-600 hover:text-white"><FaTimes /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <img src={c.userPicture} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                    <div className="bg-white/5 p-3 rounded-2xl flex-1 border border-white/[0.03]">
                      <p className="text-cyan-500 font-bold text-[11px] mb-1">{c.userName || "Drifter"}</p>
                      <p className="text-xs text-gray-300">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3 items-center bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder="Type your response..." 
                  className="flex-1 bg-transparent outline-none text-xs text-gray-200 ml-2" 
                />
                <button 
                  onClick={async () => {
                    const token = await getAccessTokenSilently();
                    const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, 
                      { text: commentText, userPicture: user?.picture, userName: user?.name }, 
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setPosts(posts.map(p => p._id === activeCommentPost._id ? res.data : p));
                    setActiveCommentPost(res.data); setCommentText("");
                  }} 
                  className="bg-cyan-500 text-black p-2.5 rounded-xl"
                >
                  <FaPaperPlane size={12}/>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;