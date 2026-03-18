import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaImage, FaHeart, FaComment, FaBolt, FaRegHeart, FaRegComment, 
  FaVolumeUp, FaVolumeMute, FaPaperPlane, FaSearch, FaBrain, 
  FaFingerprint, FaHome, FaStore, FaCog 
} from 'react-icons/fa'; 
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

// কম্পোনেন্ট ইম্পোর্ট
import Marketplace from "./Marketplace"; 
import Notification from "./Notifications";
import Settings from "./Settings";
import LegacySetup from '../components/LegacySetup';

const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

/**
 * 🛠️ AUTH0 CONFIGURATION
 * আপনার Render URL টিই সাধারণত API Identifier/Audience হিসেবে ব্যবহৃত হয়।
 */
const AUTH0_AUDIENCE = "https://onyx-drift-api"; 

// --- ১. NEURAL TOAST ---
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
          <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
            <FaBrain className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] mb-0.5">Neural Shadow Sync</h4>
            <p className="text-[11px] text-gray-300 font-mono italic">{message}</p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- ২. NEURAL INPUT ---
const NeuralInput = ({ onPostSuccess, user, getAccessTokenSilently }) => {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("IDLE"); 

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setStatus("SYNCING");
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      
      const res = await axios.post(`${API_URL}/api/posts`, {
        text,
        authorName: user?.name,
        isAiGenerated: true,
        aiPersona: "Neural Shadow"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data) {
        setStatus("SUCCESS");
        setTimeout(() => {
            setStatus("IDLE");
            setText("");
            if (onPostSuccess) onPostSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error("Neural Sync Failed:", err);
      setStatus("IDLE");
    }
  };

  return (
    <motion.div 
      animate={status === "SYNCING" ? { x: [0, -2, 2, 0], filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] } : {}}
      transition={{ repeat: Infinity, duration: 0.2 }}
      className="bg-[#080808] border border-cyan-500/20 p-5 rounded-[24px] mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
          <h3 className="text-cyan-500 font-mono text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
            <FaBrain className={status === "SYNCING" ? "animate-spin" : ""} /> Neural_Core_v2
          </h3>
      </div>
      <textarea 
        className="w-full bg-transparent border-none outline-none text-gray-200 font-mono text-sm placeholder-zinc-700 resize-none min-h-[80px]"
        placeholder="Type a thought to synthesize..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-3">
        <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">
            {status === "SYNCING" ? ">> SYNTHESIZING..." : ">> AWAITING_INPUT"}
        </span>
        <button 
          onClick={handleGenerate}
          disabled={status === "SYNCING" || !text.trim()}
          className="px-6 py-2 rounded-xl text-[10px] font-black border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all"
        >
          {status === "SYNCING" ? "SYNCING..." : "Execute"}
        </button>
      </div>
    </motion.div>
  );
};

// --- ৩. COMPACT VIDEO ---
const CompactVideo = ({ src }) => {
  const [isMuted, setIsMuted] = useState(true);
  return (
    <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black w-full">
      <video src={src} autoPlay muted={isMuted} loop playsInline className="w-full h-auto max-h-[450px] object-cover" />
      <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white z-10 backdrop-blur-md border border-white/10">
        {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} className="text-cyan-400" />}
      </button>
    </div>
  );
};

// --- ৪. MAIN FEED COMPONENT ---
const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0(); 

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState("home"); 
  const [activeFilter, setActiveFilter] = useState("Global");
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false); 
  const [toast, setToast] = useState({ show: false, message: "" });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: AUTH0_AUDIENCE
        }
      });
      
      const response = await axios.get(`${API_URL}/api/posts/neural-feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err) { 
      console.error("Feed Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/");
      } else {
        fetchPosts();
      }
    }
  }, [isAuthenticated, isLoading, activeTab]); // Tab চেঞ্জ হলে রিফ্রেশ হবে

  const handleLike = async (postId) => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE }
      });
      const res = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
    } catch (err) { console.error("Like Error", err); }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE }
      });
      
      const formData = new FormData();
      formData.append("text", postText);
      formData.append("authorName", user?.name || "Anonymous");
      formData.append("authorAvatar", user?.picture);
      formData.append("isEncrypted", isEncrypted);
      if (mediaFile) formData.append("media", mediaFile);
      
      const response = await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPosts(prev => [response.data, ...prev]);
      setPostText(""); 
      setMediaFile(null); 
      setIsPostModalOpen(false);
      setToast({ show: true, message: "Uplink Successful" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
    } catch (err) { 
      console.error("Transmission Error:", err);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeFilter === "Encrypted") result = posts.filter(p => p.isEncrypted);
    if (activeFilter === "Resonance") result = posts.filter(p => p.isAiGenerated);
    if (searchQuery) {
        result = result.filter(p => p.text?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [posts, activeFilter, searchQuery]);

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-500 font-mono">NEURAL_SYNCING...</div>;

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32 font-sans overflow-x-hidden">
      <NeuralToast isVisible={toast.show} message={toast.message} />

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name || 'U'}`} 
            className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer object-cover" 
            onClick={() => setIsSideMenuOpen(true)} 
            alt="profile" 
          />
          <h2 className="text-lg font-black italic text-cyan-500 tracking-tighter uppercase cursor-pointer" onClick={() => setActiveTab('home')}>
            Onyx<span className="text-white">Drift</span>
          </h2>
        </div>
        <div className="flex gap-4 items-center">
          <FaSearch className="text-zinc-400 cursor-pointer" onClick={() => navigate('/search')} />
          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
            <FaBolt className="text-cyan-500 text-[10px]" />
            <span className="text-[10px] font-mono text-cyan-200">99</span>
          </div>
        </div>
      </header>

      {/* --- SIDE MENU --- */}
      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSideMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-[280px] bg-[#050505] border-r border-cyan-500/10 z-[201] p-6 shadow-2xl">
                <div className="mb-10 group cursor-pointer" onClick={() => { navigate(`/profile/${user?.sub}`); setIsSideMenuOpen(false); }}>
                    <div className="relative w-16 h-16 mb-4">
                      <img src={user?.picture} className="w-full h-full rounded-2xl border-2 border-cyan-500/20 object-cover" alt="user" />
                    </div>
                    <h4 className="font-black text-gray-100 text-lg uppercase">{user?.name}</h4>
                    <p className="text-[9px] text-cyan-500 font-mono tracking-widest mt-1">Neural Link: ACTIVE</p>
                </div>

                <nav className="flex flex-col gap-2">
                  {[
                    { icon: <FaHome />, label: 'Neural Feed', tab: 'home' }, 
                    { icon: <FaStore />, label: 'Marketplace', tab: 'market' }, 
                    { icon: <FaBrain />, label: 'AI Twin Sync', path: `/ai-twin` }, 
                    { icon: <FaFingerprint />, label: 'Digital Legacy', tab: 'legacy' },
                    { icon: <FaCog />, label: 'Settings', tab: 'settings' }
                  ].map((item, i) => (
                    <div key={i} onClick={() => { if(item.tab) setActiveTab(item.tab); if(item.path) navigate(item.path); setIsSideMenuOpen(false); }} className={`flex items-center gap-4 p-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === item.tab ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-white'}`}>
                      <span className="text-lg">{item.icon}</span> {item.label}
                    </div>
                  ))}
                </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[550px] mx-auto border-x border-white/5 min-h-screen bg-black/40">
        {activeTab === "home" && (
          <>
            <div className="flex justify-center gap-2 py-4 border-b border-white/5 sticky top-14 z-50 bg-black/80 backdrop-blur-md px-4">
              {['Global', 'Encrypted', 'Resonance'].map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeFilter === f ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-zinc-500 border-white/5'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="px-5 pt-6">
                <NeuralInput user={user} onPostSuccess={fetchPosts} getAccessTokenSilently={getAccessTokenSilently} />
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20 gap-4">
                   <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[9px] text-cyan-500 font-mono tracking-[2px]">Scanning Grid Waves...</p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                  {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={post._id} className={`p-5 transition-all ${post.isAiGenerated ? 'bg-purple-500/[0.03] border-l-2 border-purple-500' : 'hover:bg-white/[0.01]'}`}>
                      <div className="flex gap-3">
                        <img 
                          src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}`} 
                          className="w-11 h-11 rounded-2xl border border-white/10 object-cover cursor-pointer" 
                          alt="avatar" 
                          onClick={() => navigate(`/profile/${post.userId}`)} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-[11px] uppercase tracking-wide text-gray-200">
                                {post.authorName} {post.isAiGenerated && " [TWIN]"}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-600">
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-[13px] leading-relaxed ${post.isAiGenerated ? 'text-purple-300 italic font-mono' : 'text-gray-400'}`}>
                            {post.text}
                          </p>
                          {post.media && (
                            <div className="mt-3">
                              {post.media.match(/\.(mp4|webm|mov)$/i) ? <CompactVideo src={post.media} /> : <img src={post.media} className="w-full rounded-2xl border border-white/10 max-h-[450px] object-cover" alt="media" />}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-4">
                              <button onClick={() => handleLike(post._id)} className={`flex items-center gap-1.5 text-[10px] font-bold ${post.likes?.includes(user?.sub) ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}>
                                {post.likes?.includes(user?.sub) ? <FaHeart /> : <FaRegHeart />} {post.likes?.length || 0}
                              </button>
                              <button className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-cyan-400">
                                <FaRegComment /> {post.comments?.length || 0}
                              </button>
                            </div>
                            <button className="text-zinc-600 hover:text-purple-400"><FaBrain size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-20 text-zinc-600 text-[10px] font-mono">NO_DATA_IN_GRID</div>
                  )}
                </div>
            )}
          </>
        )}
        
        {activeTab === "market" && <Marketplace />}
        {activeTab === "notify" && <Notification />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "legacy" && <div className="p-6"><LegacySetup /></div>}
      </main>

      {/* FAB - NEURAL UPLINK */}
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={() => setIsPostModalOpen(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 bg-cyan-500 text-black rounded-2xl flex items-center justify-center shadow-lg z-[100]"
      >
        <FaBolt size={20} />
      </motion.button>

      {/* POST MODAL */}
      <AnimatePresence>
        {isPostModalOpen && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPostModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg bg-[#0A0A0A] border border-cyan-500/20 rounded-[32px] p-6 shadow-2xl">
                <textarea 
                  placeholder="Broadcast to OnyxDrift..." 
                  value={postText} 
                  onChange={(e) => setPostText(e.target.value)} 
                  className="w-full bg-transparent outline-none text-white resize-none min-h-[150px] font-mono text-sm" 
                />
                
                <div className="flex items-center gap-4 mt-4">
                    <input type="file" onChange={(e) => setMediaFile(e.target.files[0])} className="text-[10px] text-zinc-500" />
                    <label className="flex items-center gap-2 text-[10px] text-cyan-500">
                        <input type="checkbox" checked={isEncrypted} onChange={() => setIsEncrypted(!isEncrypted)} /> Encrypt
                    </label>
                </div>

                <button 
                  onClick={handlePostSubmit} 
                  disabled={isSubmitting}
                  className="mt-4 w-full py-3 bg-cyan-500 text-black font-black rounded-xl hover:bg-cyan-400 transition-colors"
                >
                  {isSubmitting ? "TRANSMITTING..." : "EXECUTE UPLINK"}
                </button>
              </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;