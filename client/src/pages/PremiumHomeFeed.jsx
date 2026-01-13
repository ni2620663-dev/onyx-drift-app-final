import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaImage, FaVideo, FaBroadcastTower } from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client"; 
import PostCard from "../components/PostCard"; 

const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); // মডাল কন্ট্রোল
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  // ডিফল্ট স্টোরি ডেটা
  const [stories] = useState([
    { id: 1, name: 'ALEX', img: 'https://i.pravatar.cc/150?u=11' },
    { id: 2, name: 'JORDAN', img: 'https://i.pravatar.cc/150?u=12' },
    { id: 3, name: 'SARA', img: 'https://i.pravatar.cc/150?u=13' },
    { id: 4, name: 'MIA', img: 'https://i.pravatar.cc/150?u=14' },
    { id: 5, name: 'NOAH', img: 'https://i.pravatar.cc/150?u=15' },
  ]);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const storyInputRef = useRef(null);
  const postMediaRef = useRef(null);
  const socketRef = useRef(null);

  // --- Socket.io ---
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

  useEffect(() => { fetchPosts(); }, []);

  const filteredPosts = posts.filter((post) => {
    const term = searchQuery.toLowerCase();
    return (post.authorName?.toLowerCase().includes(term) || post.text?.toLowerCase().includes(term));
  });

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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      setPostText(""); 
      setMediaFile(null); 
      setMediaPreview(null);
      setIsPostModalOpen(false); // পোস্ট হয়ে গেলে মডাল বন্ধ হবে
      fetchPosts(); 
    } catch (err) { 
      console.error("Post Error:", err); 
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
    <div className="w-full min-h-screen bg-transparent text-white pb-32">
      
      {/* ১. স্টোরি সেকশন (Messenger Style) */}
      <section className="py-6 overflow-x-auto no-scrollbar border-b border-white/[0.03]">
        <div className="flex gap-5 px-5 items-center">
          {/* My Story */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div onClick={() => storyInputRef.current.click()} className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center relative cursor-pointer active:scale-90 transition-all">
              <img src={user?.picture} className="w-full h-full rounded-full object-cover opacity-40 p-1" alt="" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FaPlus size={14} className="text-cyan-500" />
              </div>
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Story</span>
            <input type="file" ref={storyInputRef} hidden accept="image/*" />
          </div>

          {/* User Stories */}
          {stories.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-blue-600 group-active:scale-95 transition-all">
                <div className="bg-[#020617] p-[2px] rounded-full">
                  <img src={s.img} className="w-14 h-14 rounded-full object-cover" alt="" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate w-14 text-center">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ২. Floating Plus Button (যদি আপনার Navbar এ বাটন না থাকে তবে এটি ব্যবহার করুন) */}
      <button 
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-90 transition-all lg:hidden"
      >
        <FaPlus size={20} />
      </button>

      {/* ৩. পোস্ট মডাল (Pop-up Box) */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0a0f1e] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <img src={user?.picture} className="w-10 h-10 rounded-full border border-cyan-500/20" alt="" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{user?.nickname}</h4>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">Neural Broadcast</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPostModalOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                    <FaTimes size={14}/>
                  </button>
                </div>

                <textarea
                  autoFocus
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's happening in the drift?"
                  className="w-full bg-transparent text-lg text-gray-200 placeholder-gray-700 outline-none resize-none min-h-[120px] leading-relaxed"
                />

                {mediaPreview && (
                  <div className="relative mt-4 rounded-2xl overflow-hidden border border-white/10">
                    <img src={mediaPreview} className="w-full h-auto max-h-[300px] object-cover" alt="preview" />
                    <button onClick={() => {setMediaPreview(null); setMediaFile(null);}} className="absolute top-2 right-2 bg-black/70 p-2 rounded-full text-white backdrop-blur-md">
                      <FaTimes size={10}/>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.05]">
                  <div className="flex gap-4">
                    <button onClick={() => postMediaRef.current.click()} className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors">
                      <FaImage size={18} />
                      <span className="text-[10px] font-bold uppercase">Media</span>
                    </button>
                    <input type="file" ref={postMediaRef} onChange={handleMediaSelect} hidden accept="image/*,video/*" />
                  </div>

                  <button 
                    disabled={isSubmitting || (!postText.trim() && !mediaFile)}
                    onClick={handlePostSubmit}
                    className="bg-cyan-500 text-black px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-20 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {isSubmitting ? "SYNCING..." : "SEND SIGNAL"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ৪. ফিড এরিয়া */}
      <section className="mt-4 flex flex-col">
        <div className="flex items-center gap-4 px-6 mb-6">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] whitespace-nowrap">Neural Feed</h3>
          <div className="h-[1px] w-full bg-gradient-to-r from-white/[0.05] to-transparent"></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-cyan-500/50 uppercase tracking-widest">Syncing...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="flex flex-col gap-1">
            {filteredPosts.map(post => (
              <PostCard key={post._id} post={post} onAction={fetchPosts} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-32 opacity-20">
            <p className="italic text-xs tracking-[0.3em] uppercase">No Signals Detected</p>
          </div>
        )}
      </section>

    </div>
  );
};

export default PremiumHomeFeed;