import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaHeart, FaComment, FaShareAlt, FaDownload, FaEllipsisH } from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client"; 

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
      if (mediaFile) {
        formData.append("media", mediaFile); 
      }
      formData.append("isReel", "false"); 

      const response = await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data" 
        }
      });

      if (response.status === 201 || response.status === 200) {
        setPostText(""); 
        setMediaFile(null); 
        setMediaPreview(null);
        setIsPostModalOpen(false); 
        fetchPosts(); 
      }
    } catch (err) { 
      console.error("Transmission Failed:", err.response?.data || err.message);
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
    <div className="w-full min-h-screen bg-[#02040a] text-white pt-2 pb-24">
      
      {/* ১. ফিড হেডার (আগের মতোই রাখা হয়েছে) */}
      <section className="flex flex-col px-4 max-w-[550px] mx-auto">
        <div className="flex items-center gap-4 mb-6 opacity-40">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">
            Neural Feed
          </h3>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>

        {/* ২. টুইটার স্টাইল পোস্ট লিস্ট */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] font-bold text-cyan-500/50 uppercase tracking-[0.2em]">Syncing Neural Data...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="flex flex-col">
            {filteredPosts.map(post => (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                key={post._id} 
                className="border-b border-white/10 pb-4 mb-4"
              >
                {/* টুইটার স্টাইল লেআউট: বামে এভাটার, ডানে কন্টেন্ট */}
                <div className="flex gap-3 px-2">
                  <img 
                    src={post.authorPicture || "https://via.placeholder.com/40"} 
                    className="w-11 h-11 rounded-full object-cover border border-white/5" 
                    alt="User" 
                  />
                  
                  <div className="flex-1">
                    {/* ইউজার নেম ও টাইমলাইন */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[14px] font-bold text-gray-100 hover:underline cursor-pointer">{post.authorName}</span>
                        <span className="text-[13px] text-gray-500">· {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <FaEllipsisH className="text-gray-600 text-sm" />
                    </div>

                    {/* পোস্ট টেক্সট */}
                    {post.text && (
                      <p className="text-[15px] text-gray-200 mt-1 leading-normal mb-3">
                        {post.text}
                      </p>
                    )}

                    {/* মিডিয়া (টুইটারের মতো কার্ভড বর্ডার) */}
                    {post.mediaUrl && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 bg-black/20 max-h-[500px]">
                        {post.mediaUrl.endsWith('.mp4') || post.mediaUrl.includes('video') ? (
                          <video 
                            src={post.mediaUrl} 
                            controls 
                            className="w-full h-auto object-contain"
                          />
                        ) : (
                          <img 
                            src={post.mediaUrl} 
                            className="w-full h-auto object-contain" 
                            alt="Post content" 
                            loading="lazy"
                          />
                        )}
                      </div>
                    )}

                    {/* অ্যাকশন বার (টুইটার স্টাইল আইকন সেট) */}
                    <div className="flex justify-between items-center mt-4 max-w-md opacity-80">
                      <button className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-all group">
                        <div className="p-2 group-hover:bg-cyan-500/10 rounded-full transition-all">
                            <FaComment size={16}/>
                        </div>
                        <span className="text-[12px]">{post.comments?.length || 0}</span>
                      </button>
                      
                      <button className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition-all group">
                        <div className="p-2 group-hover:bg-pink-500/10 rounded-full transition-all">
                            <FaHeart size={16}/>
                        </div>
                        <span className="text-[12px]">{post.likes?.length || 0}</span>
                      </button>

                      <button className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-500/10 rounded-full transition-all">
                        <FaDownload size={15}/>
                      </button>

                      <button className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full transition-all">
                        <FaShareAlt size={15}/>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-32 opacity-20">
            <p className="italic text-[10px] tracking-[0.3em] uppercase font-bold text-center text-gray-500">
              Empty Drift — No Signals Detected
            </p>
          </div>
        )}
      </section>

      {/* ৩. পোস্ট মডাল (Popup) - আগের মতোই রাখা হয়েছে */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-[#0d1117] rounded-t-[32px] sm:rounded-[32px] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <img src={user?.picture} className="w-10 h-10 rounded-full border border-cyan-500/20" alt="me" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-tighter">{user?.nickname}</h4>
                      <p className="text-[8px] text-cyan-500 uppercase tracking-[0.2em] font-black">Transmit Mode</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPostModalOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400">
                    <FaTimes size={12}/>
                  </button>
                </div>

                <textarea
                  autoFocus
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share with the drift..."
                  className="w-full bg-transparent text-lg text-gray-200 placeholder-gray-700 outline-none resize-none min-h-[140px]"
                />

                {mediaPreview && (
                  <div className="relative mt-2 rounded-2xl overflow-hidden border border-white/10 max-h-[300px] bg-black">
                    <img src={mediaPreview} className="w-full h-full object-contain" alt="preview" />
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
                      <FaImage size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Media</span>
                    </button>
                    <input type="file" ref={postMediaRef} onChange={handleMediaSelect} hidden accept="image/*,video/*" />
                  </div>

                  <button 
                    disabled={isSubmitting || (!postText.trim() && !mediaFile)}
                    onClick={handlePostSubmit}
                    className="bg-white text-black px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20"
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