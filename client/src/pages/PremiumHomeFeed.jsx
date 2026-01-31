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

// --- উন্নত ভিডিও কম্পোনেন্ট (সাউন্ড কন্ট্রোলসহ) ---
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
      {/* Sound Button */}
      <button onClick={toggleMute} className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/20 z-10 hover:scale-110 transition-all">
        {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} className="text-cyan-400" />}
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
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
  const postMediaRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/posts`);
        setPosts(response.data);
      } catch (err) { console.error("Sync Error"); } finally { setLoading(false); }
    };
    fetchPosts();
  }, []);

  // --- LIKE FUNCTION ---
  const handleLike = async (postId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // আপডেট করা পোস্ট লিস্টে সেট করা
      setPosts(posts.map(p => p._id === postId ? res.data : p));
    } catch (err) { console.error("Like error", err); }
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({ title: 'OnyxDrift', text: post.text, url: window.location.href });
    } else { alert("Link copied to clipboard!"); }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={user?.picture} 
            className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer hover:opacity-80 transition-all" 
            alt="profile" 
            onClick={() => setIsSideMenuOpen(true)} 
          />
          <h2 className="text-lg font-bold italic text-cyan-500 tracking-tighter">OnyxDrift</h2>
        </div>
        <div className="flex gap-4 items-center">
            <FaEnvelope className="text-zinc-500 cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/messenger')} />
            <FaBolt className="text-cyan-500 animate-pulse" />
        </div>
      </div>

      {/* --- X STYLE SIDE MENU --- */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsSideMenuOpen(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" 
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="fixed top-0 left-0 h-full w-[280px] bg-black border-r border-white/10 z-[201] p-6 shadow-2xl"
            >
               <div className="flex flex-col h-full">
                  <div className="mb-8">
                    <img src={user?.picture} className="w-14 h-14 rounded-full border-2 border-cyan-500/20 mb-3" alt="" />
                    <h4 className="font-black text-gray-100 text-lg uppercase tracking-tighter">{user?.name}</h4>
                    <p className="text-xs text-zinc-500 font-mono">@{user?.nickname || 'drifter'}</p>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {[
                      { icon: <FaHome />, label: 'Home Feed', path: '/feed' },
                      { icon: <FaUserCircle />, label: 'My Profile', path: `/profile/${user?.sub}` },
                      { icon: <FaSearch />, label: 'Explore Search', path: '/search' },
                      { icon: <FaRegBell />, label: 'Notifications', path: '/notifications' },
                      { icon: <FaEnvelope />, label: 'Messages', path: '/messenger' },
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => { navigate(item.path); setIsSideMenuOpen(false); }}
                        className="flex items-center gap-4 p-3 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-white/5 cursor-pointer transition-all font-bold text-sm uppercase tracking-widest"
                      >
                        <span className="text-lg">{item.icon}</span> {item.label}
                      </div>
                    ))}
                  </nav>

                  <div className="mt-auto border-t border-white/5 pt-4">
                     <button onClick={() => setIsSideMenuOpen(false)} className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em]">Close System</button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                      <img src={post.media} className="mt-3 rounded-2xl border border-white/5 w-full max-h-[500px] object-cover" alt="" />
                    )}

                    {/* --- Interaction Bar --- */}
                    <div className="flex items-center justify-between mt-5 px-1 text-zinc-500">
                      <div className="flex gap-6">
                        <button onClick={() => handleLike(post._id)} className="flex items-center gap-2 hover:text-rose-500 transition-colors">
                           {post.likes?.includes(user?.sub) ? <FaHeart className="text-rose-500" /> : <FaRegHeart />} 
                           <span className="text-[11px] font-bold">{post.likes?.length || 0}</span>
                        </button>
                        <button onClick={() => setActiveCommentPost(post)} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                           <FaRegComment size={16} /> <span className="text-[11px] font-bold">{post.comments?.length || 0}</span>
                        </button>
                        <div className="flex items-center gap-2 opacity-60">
                           <FaEye size={14} /> <span className="text-[11px] font-bold">{Math.floor(Math.random() * 500) + 20}</span>
                        </div>
                      </div>
                      <button onClick={() => handleShare(post)} className="p-2 bg-zinc-900/50 rounded-lg hover:text-cyan-400 transition-all">
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

      {/* --- উন্নত কমেন্ট সেকশন --- */}
      <AnimatePresence>
        {activeCommentPost && (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentPost(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-[550px] bg-[#0A0A0A] rounded-t-[32px] border-t border-white/10 h-[70vh] flex flex-col p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.2em]">Signal Comments</h3>
                <button onClick={() => setActiveCommentPost(null)} className="text-zinc-600 hover:text-white transition-colors"><FaTimes /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activeCommentPost.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3 items-start animate-fadeIn">
                    <img 
                      src={c.userPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userName}`} 
                      className="w-8 h-8 rounded-full border border-white/10" 
                      alt="user" 
                    />
                    <div className="bg-white/5 p-3 rounded-2xl flex-1 border border-white/[0.03]">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-cyan-500 font-bold text-[11px]">{c.userName || "Drifter"}</p>
                        <span className="text-[8px] text-zinc-600">ID_{Math.floor(Math.random() * 9999)}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3 items-center bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
                <img src={user?.picture} className="w-8 h-8 rounded-full" alt="me" />
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder="Type your response..." 
                  className="flex-1 bg-transparent outline-none text-xs text-gray-200" 
                />
                <button 
                  onClick={async () => {
                    if(!commentText.trim()) return;
                    const token = await getAccessTokenSilently();
                    const res = await axios.post(`${API_URL}/api/posts/${activeCommentPost._id}/comment`, 
                      { text: commentText, userPicture: user?.picture, userName: user?.name }, 
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setPosts(posts.map(p => p._id === activeCommentPost._id ? res.data : p));
                    setActiveCommentPost(res.data); 
                    setCommentText("");
                  }} 
                  className="bg-cyan-500 text-black p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <FaPaperPlane size={12}/>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FIXED BOTTOM BLUE BAR (এখন কাজ করবে) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-lg border-t border-white/5 h-16 flex justify-around items-center px-6 z-[200]">
        <FaHome className="text-cyan-500 text-xl cursor-pointer" onClick={() => navigate('/feed')} />
        <FaSearch className="text-zinc-500 text-xl cursor-pointer" onClick={() => navigate('/search')} />
        <div className="bg-white text-black p-3 rounded-xl -mt-8 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer" onClick={() => setIsPostModalOpen(true)}>
          <FaBolt />
        </div>
        <FaRegBell className="text-zinc-500 text-xl cursor-pointer" onClick={() => navigate('/notifications')} />
        <FaUserCircle className="text-zinc-500 text-xl cursor-pointer" onClick={() => navigate(`/profile/${user?.sub}`)} />
      </div>

      {/* Floating Button (Secondary Post Opener) */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} 
        onClick={() => setIsPostModalOpen(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] z-[100] md:hidden"
      >
        <FaBolt size={20} />
      </motion.button>
    </div>
  );
};

export default PremiumHomeFeed;