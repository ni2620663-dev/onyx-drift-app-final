import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaRegHeart, FaRegComment, FaShareAlt, FaBolt, 
  FaBrain, FaLock, FaFingerprint, FaSyncAlt, FaSearch, 
  FaRegBell, FaHome, FaStore, FaCog, FaTimes, FaImage, FaPaperPlane
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const AUDIENCE = "https://onyx-drift-app-final-u29m.onrender.com";

const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0();
  const navigate = useNavigate();
  const postMediaRef = useRef(null);

  // States
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

  // --- ১. নিরাপদ টোকেন ফেচার ---
  const getSafeToken = async () => {
    try {
      return await getAccessTokenSilently({
        authorizationParams: { 
          audience: AUDIENCE,
          scope: "openid profile email offline_access" 
        }
      });
    } catch (e) {
      console.error("Token acquisition failed:", e.message);
      return null;
    }
  };

  // --- ২. ডাটা ফেচিং (Neural & Global) ---
  const fetchData = async () => {
    if (authLoading) return;
    setLoading(true);
    const token = await getSafeToken();

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // প্রথমে Neural Feed ট্রাই করবে
      const response = await axios.get(`${API_URL}/api/posts/neural-feed`, { headers });
      setPosts(response.data);
    } catch (err) {
      console.warn("Neural feed failed, fetching public posts...");
      try {
        const fallback = await axios.get(`${API_URL}/api/posts`, { headers });
        setPosts(fallback.data);
      } catch (finalErr) {
        showToast("Signal Lost: Network Failure");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ৩. প্রোফাইল লোড ---
  const fetchProfile = async () => {
    const token = await getSafeToken();
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(res.data);
    } catch (err) {
      console.error("Profile fetch error");
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
      fetchProfile();
    }
  }, [authLoading]);

  // --- ৪. হেল্পার ফাংশনস ---
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 4000);
  };

  const filteredPosts = useMemo(() => {
    let list = posts.filter(p => 
      p.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (activeFilter === "Resonance") return [...list].sort((a, b) => (b.resonanceScore || 0) - (a.resonanceScore || 0));
    if (activeFilter === "Encrypted") return list.filter(p => p.isEncrypted);
    return list;
  }, [posts, activeFilter, searchQuery]);

  // --- ৫. লাইক হ্যান্ডেলার ---
  const handleLike = async (postId) => {
    if (!isAuthenticated) return navigate('/login');
    
    // Optimistic Update
    setPosts(prev => prev.map(p => p._id === postId ? {
      ...p,
      likes: p.likes?.includes(user.sub) ? p.likes.filter(id => id !== user.sub) : [...(p.likes || []), user.sub]
    } : p));

    const token = await getSafeToken();
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      fetchData(); // এরর হলে রিফ্রেশ করবে
    }
  };

  // --- ৬. পোস্ট সাবমিট ---
  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    const token = await getSafeToken();

    try {
      const formData = new FormData();
      formData.append("text", postText);
      formData.append("isEncrypted", isEncrypted);
      if (mediaFile) formData.append("media", mediaFile);

      const res = await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setPosts([res.data, ...posts]);
      setPostText("");
      setMediaFile(null);
      setIsPostModalOpen(false);
      showToast("Transmission Successful");
    } catch (err) {
      alert("Post failed. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-20 selection:bg-cyan-500/30">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{y: -20, opacity: 0}} animate={{y: 20, opacity: 1}} exit={{y: -20, opacity: 0}} className="fixed top-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
            <div className="bg-cyan-500 text-black px-6 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={user?.picture} className="w-9 h-9 rounded-full border border-cyan-500/50 cursor-pointer" onClick={() => setIsSideMenuOpen(true)} alt="profile" />
          <h2 className="text-xl font-black italic text-cyan-500 tracking-tighter uppercase">Onyx<span className="text-white">Drift</span></h2>
        </div>
        <div className="flex gap-4 items-center">
          <FaSearch className="text-zinc-400 cursor-pointer hover:text-white" onClick={() => navigate('/search')} />
          <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
            <FaBolt className="text-cyan-500 text-xs animate-pulse" />
            <span className="text-xs font-mono text-cyan-200">{userProfile?.neuralRank || 0}</span>
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen pt-4">
        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-6 px-4">
          {['Global', 'Encrypted', 'Resonance'].map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeFilter === f ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-zinc-500 border-white/10'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <FaSyncAlt className="text-cyan-500 animate-spin text-2xl" />
            <p className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest">Scanning Grid...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredPosts.map((post) => (
              <motion.div key={post._id} initial={{opacity: 0}} animate={{opacity: 1}} className="p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex gap-4">
                  <img src={post.authorAvatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="avatar" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm text-gray-200">{post.authorName}</h4>
                      <span className="text-[10px] text-zinc-600">{new Date(post.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-400 text-[14px] leading-relaxed mb-3">{post.text}</p>
                    {post.media && <img src={post.media} className="rounded-2xl border border-white/5 mb-3 w-full" alt="content" />}
                    
                    <div className="flex gap-6 text-zinc-500">
                      <button onClick={() => handleLike(post._id)} className={`flex items-center gap-2 text-xs ${post.likes?.includes(user?.sub) ? 'text-rose-500' : ''}`}>
                        {post.likes?.includes(user?.sub) ? <FaHeart /> : <FaRegHeart />} {post.likes?.length || 0}
                      </button>
                      <button className="flex items-center gap-2 text-xs hover:text-cyan-400" onClick={() => setActiveCommentPost(post)}>
                        <FaRegComment /> {post.comments?.length || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* FAB - Create Post */}
      <button 
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 z-50 hover:scale-110 active:scale-95 transition-transform"
      >
        <FaBolt size={20} />
      </button>

      {/* Create Post Modal (Simplified) */}
      <AnimatePresence>
        {isPostModalOpen && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[30px] p-6">
              <textarea 
                className="w-full bg-transparent border-none outline-none text-white resize-none min-h-[150px] text-lg" 
                placeholder="What's in the drift?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
              <div className="flex justify-between mt-4">
                <input type="file" ref={postMediaRef} hidden onChange={(e) => setMediaFile(e.target.files[0])} />
                <button onClick={() => postMediaRef.current.click()} className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white">
                  <FaImage size={20} />
                </button>
                <button 
                  onClick={handlePostSubmit}
                  disabled={isSubmitting}
                  className="bg-cyan-500 text-black px-8 py-2 rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {isSubmitting ? "Syncing..." : "Transmit"}
                </button>
              </div>
            </div>
            <button className="absolute top-6 right-6 text-white" onClick={() => setIsPostModalOpen(false)}><FaTimes size={24}/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;