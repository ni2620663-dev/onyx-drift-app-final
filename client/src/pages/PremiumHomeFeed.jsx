import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaImage, FaHeart, FaComment, 
  FaShareAlt, FaDownload, FaEllipsisH, FaCheckCircle,
  FaVolumeMute, FaVolumeUp, FaCog, FaSignOutAlt
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
      {/* Sound Button */}
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
  const { user, getAccessTokenSilently, logout } = useAuth0();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postText, setPostText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  
  // Settings dropdown state
  const [activeSettingsId, setActiveSettingsId] = useState(null);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const postMediaRef = useRef(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
      setError(null);
    } catch (err) { 
      console.error("Fetch Error:", err);
      setError("Syncing with Neural Network... (Server booting up)");
      setTimeout(fetchPosts, 5000);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchPosts(); 
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeSettings = () => setActiveSettingsId(null);
    window.addEventListener('click', closeSettings);
    return () => window.removeEventListener('click', closeSettings);
  }, []);

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
          "Content-Type": "multipart/form-data" 
        }
      });

      setPostText(""); 
      setMediaFile(null); 
      setMediaPreview(null);
      setIsPostModalOpen(false); 
      fetchPosts();
    } catch (err) {
      console.error("Submit Error:", err);
      alert("Transmission failed. Please try again.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#02040a] text-white pt-4 pb-32 overflow-x-hidden font-sans">
      <section className="max-w-[550px] mx-auto px-4">
        
        {/* Connection Status */}
        {error && (
          <div className="p-3 mb-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-cyan-400 text-[10px] uppercase tracking-[0.2em] text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6 opacity-40">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Neural Feed</h3>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post) => {
              const mediaSrc = post.media || post.mediaUrl;
              const isVideo = mediaSrc?.match(/\.(mp4|webm|mov)$/i) || post.mediaType === 'video';
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  key={post._id} 
                  className="flex gap-3 py-5 border-b border-white/5 hover:bg-white/[0.01] transition-all relative"
                >
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <img 
                      src={post.authorAvatar || post.authorPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
                      className="w-11 h-11 rounded-full border border-white/10 object-cover bg-gray-900 shadow-lg" 
                      alt="avatar" 
                    />
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[15px] font-bold text-gray-100 truncate hover:text-cyan-400 cursor-pointer transition-colors">
                          {post.authorName || 'Onyx User'}
                        </span>
                        <FaCheckCircle className="text-cyan-500 text-[11px] flex-shrink-0" />
                        <span className="text-[13px] text-gray-500 truncate">
                          @{post.authorName?.split(' ')[0].toLowerCase() || 'drifter'}
                        </span>
                        <span className="text-gray-600 text-[13px]">
                          · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Now'}
                        </span>
                      </div>
                      
                      {/* Settings Dropdown Area */}
                      <div className="relative">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveSettingsId(activeSettingsId === post._id ? null : post._id); 
                          }}
                          className="p-2 text-gray-600 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/5"
                        >
                          <FaEllipsisH size={14} />
                        </button>
                        
                        <AnimatePresence>
                          {activeSettingsId === post._id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 backdrop-blur-xl"
                            >
                              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors">
                                <FaCog className="text-gray-500" /> Settings
                              </button>
                              <div className="h-[1px] bg-white/5 my-1" />
                              <button 
                                onClick={() => logout()}
                                className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <FaSignOutAlt size={12} /> Log Out
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <p className="text-[15px] text-gray-200 leading-normal mt-1 mb-3 whitespace-pre-wrap">
                      {post.text}
                    </p>

                    {/* Media Display */}
                    {mediaSrc && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                        {isVideo ? (
                          <AutoPlayVideo src={mediaSrc} />
                        ) : (
                          <img 
                            src={mediaSrc} 
                            className="w-full h-auto object-cover max-h-[550px]" 
                            alt="post-media" 
                            loading="lazy" 
                          />
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between mt-4 max-w-[420px] text-gray-500">
                      <button className="flex items-center gap-2 hover:text-cyan-400 transition-colors group">
                        <div className="p-2 group-hover:bg-cyan-500/10 rounded-full"><FaComment size={16}/></div>
                        <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-pink-500 transition-colors group">
                        <div className="p-2 group-hover:bg-pink-500/10 rounded-full"><FaHeart size={16}/></div>
                        <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                      </button>
                      <button className="p-2 hover:text-green-500 hover:bg-green-500/10 rounded-full transition-all"><FaDownload size={15}/></button>
                      <button className="p-2 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full transition-all"><FaShareAlt size={15}/></button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Create Post Modal --- */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-start sm:items-center justify-center pt-4 sm:pt-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsPostModalOpen(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="relative w-full max-w-lg bg-[#0d1117] rounded-2xl border border-white/10 shadow-2xl mx-4 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setIsPostModalOpen(false)} className="text-gray-400 hover:text-white p-2">
                    <FaTimes size={18}/>
                  </button>
                  <button 
                    disabled={isSubmitting || (!postText.trim() && !mediaFile)} 
                    onClick={handlePostSubmit} 
                    className="bg-cyan-500 text-white px-6 py-1.5 rounded-full text-[14px] font-bold disabled:opacity-40 hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {isSubmitting ? "Syncing..." : "Transmit"}
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <img src={user?.picture} className="w-10 h-10 rounded-full border border-white/10" alt="me" />
                  <textarea 
                    autoFocus 
                    value={postText} 
                    onChange={(e) => setPostText(e.target.value)} 
                    placeholder="Broadcast your signal..." 
                    className="w-full bg-transparent text-[19px] text-gray-100 placeholder-gray-600 outline-none resize-none min-h-[150px]" 
                  />
                </div>

                {mediaPreview && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 max-h-[300px] bg-black group">
                    <img src={mediaPreview} className="w-full h-full object-contain" alt="preview" />
                    <button 
                      onClick={() => {setMediaPreview(null); setMediaFile(null);}} 
                      className="absolute top-2 right-2 bg-black/70 p-2 rounded-full text-white hover:bg-rose-500 transition-colors"
                    >
                      <FaTimes size={12}/>
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                   <div className="flex gap-2">
                     <button 
                       onClick={() => postMediaRef.current.click()} 
                       className="text-cyan-500 hover:bg-cyan-500/10 p-2.5 rounded-full transition-all"
                       title="Add Media"
                     >
                       <FaImage size={22} />
                     </button>
                     <input 
                       type="file" 
                       ref={postMediaRef} 
                       onChange={handleMediaSelect} 
                       hidden 
                       accept="image/*,video/*" 
                     />
                   </div>
                   <span className={`text-[11px] font-mono ${postText.length > 200 ? 'text-amber-500' : 'text-gray-600'}`}>
                     {postText.length} / 280
                   </span>
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