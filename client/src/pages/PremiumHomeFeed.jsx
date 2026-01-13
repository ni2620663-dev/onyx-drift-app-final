import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaVideo } from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client"; 
import PostCard from "../components/PostCard"; 

const PremiumHomeFeed = ({ searchQuery = "", isPostModalOpen, setIsPostModalOpen }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const postMediaRef = useRef(null);
  const socketRef = useRef(null);

  // --- Socket.io Connection ---
  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = io(API_URL, { transports: ["polling", "websocket"] });
      socketRef.current.on("receiveNewPost", (newPost) => {
        setPosts((prev) => [newPost, ...prev]);
      });
      return () => socketRef.current?.disconnect();
    }
  }, [isAuthenticated, API_URL]);

  // --- Fetch Posts ---
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchPosts(); 
  }, []);

  // --- Filtering Logic ---
  const filteredPosts = posts.filter((post) => {
    const term = searchQuery.toLowerCase();
    return (
      post.authorName?.toLowerCase().includes(term) || 
      post.text?.toLowerCase().includes(term)
    );
  });

  // --- Submit Post ---
  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("text", postText);
      if (mediaFile) formData.append("media", mediaFile);
      formData.append("authorName", user?.nickname || user?.name || "Drifter");
      formData.append("authorAvatar", user?.picture || "");
      formData.append("auth0Id", user?.sub || "");

      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data" 
        }
      });

      // Reset State
      setPostText(""); 
      setMediaFile(null); 
      setMediaPreview(null);
      setIsPostModalOpen(false); // ক্লোজ মডাল
      fetchPosts(); // রিফ্রেশ ফিড
    } catch (err) { 
      console.error("Post Error:", err); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // --- Media Handle ---
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
    <div className="w-full min-h-screen bg-transparent text-white pt-2 pb-24">
      
      {/* ১. ফিড হেডার */}
      <section className="flex flex-col px-4">
        <div className="flex items-center gap-4 mb-6 opacity-60">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] whitespace-nowrap">
            Neural Feed
          </h3>
          <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        {/* ২. পোস্ট লিস্ট */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] font-bold text-cyan-500/50 uppercase tracking-[0.2em]">Syncing Neural Data...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredPosts.map(post => (
              <PostCard key={post._id} post={post} onAction={fetchPosts} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-32 opacity-20">
            <p className="italic text-[10px] tracking-[0.3em] uppercase font-bold text-center">
              Empty Drift — No Signals Detected
            </p>
          </div>
        )}
      </section>

      {/* ৩. পোস্ট মডাল (Popup) */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d1117] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <img src={user?.picture} className="w-10 h-10 rounded-full border border-cyan-500/20" alt="me" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-tighter">{user?.nickname}</h4>
                      <p className="text-[8px] text-cyan-500 uppercase tracking-[0.2em] font-black">Broadcast Mode</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPostModalOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                    <FaTimes size={12}/>
                  </button>
                </div>

                <textarea
                  autoFocus
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share your thoughts with the drift..."
                  className="w-full bg-transparent text-md text-gray-200 placeholder-gray-700 outline-none resize-none min-h-[140px] leading-relaxed"
                />

                {mediaPreview && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-white/10 max-h-[250px]">
                    <img src={mediaPreview} className="w-full h-full object-cover" alt="preview" />
                    <button 
                      onClick={() => {setMediaPreview(null); setMediaFile(null);}} 
                      className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full text-white"
                    >
                      <FaTimes size={10}/>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <div className="flex gap-4">
                    <button onClick={() => postMediaRef.current.click()} className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors">
                      <FaImage size={18} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Add Media</span>
                    </button>
                    <input 
                      type="file" 
                      ref={postMediaRef} 
                      onChange={handleMediaSelect} 
                      hidden 
                      accept="image/*,video/*" 
                    />
                  </div>

                  <button 
                    disabled={isSubmitting || (!postText.trim() && !mediaFile)}
                    onClick={handlePostSubmit}
                    className="bg-cyan-500 text-black px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-cyan-400"
                  >
                    {isSubmitting ? "Syncing..." : "Transmit"}
                  </button>
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