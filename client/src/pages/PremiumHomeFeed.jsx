import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaImage, FaVideo } from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client"; 
import PostCard from "../components/PostCard"; 

const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  // ডিফল্ট স্টোরি ডেটা
  const [stories] = useState([
    { id: 1, name: 'ALEX', img: 'https://i.pravatar.cc/150?u=11' },
    { id: 2, name: 'JORDAN', img: 'https://i.pravatar.cc/150?u=12' },
    { id: 3, name: 'SARA', img: 'https://i.pravatar.cc/150?u=13' },
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

  // সার্চ ফিল্টারিং
  const filteredPosts = posts.filter((post) => {
    const term = searchQuery.toLowerCase();
    return (post.authorName?.toLowerCase().includes(term) || post.text?.toLowerCase().includes(term));
  });

  // পোস্ট সাবমিট হ্যান্ডলার
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
      
      {/* ১. স্টোরি সেকশন (হেডার রিমুভ করা হয়েছে কারণ App.js এ Navbar আছে) */}
      <section className="py-4 overflow-x-auto no-scrollbar border-b border-white/[0.03]">
        <div className="flex gap-4 px-4 items-center">
          {/* My Story */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div onClick={() => storyInputRef.current.click()} className="w-[68px] h-[68px] rounded-full border border-white/10 flex items-center justify-center bg-white/5 relative cursor-pointer active:scale-90 transition-transform">
              <img src={user?.picture} className="w-full h-full rounded-full object-cover opacity-60" alt="" />
              <div className="absolute bottom-0 right-0 bg-cyan-500 text-black rounded-full p-1 border-4 border-[#020617]">
                <FaPlus size={8} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 tracking-tight uppercase">Your Story</span>
            <input type="file" ref={storyInputRef} hidden accept="image/*" />
          </div>

          {/* User Stories */}
          {stories.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-blue-600 group-active:scale-95 transition-transform">
                <div className="bg-[#020617] p-[2px] rounded-full">
                  <img src={s.img} className="w-[60px] h-[60px] rounded-full object-cover" alt="" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-gray-400 tracking-tight uppercase">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ২. পোস্ট ইনপুট (নিউরন স্টাইল) */}
      <section className="px-4 py-6">
        <div className={`transition-all duration-500 rounded-[2.5rem] p-5 ${isFocused ? "bg-white/[0.04] border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.05)]" : "bg-white/[0.02] border border-white/[0.05]"}`}>
          <div className="flex gap-4">
            <img src={user?.picture} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
            <div className="flex-1">
              <textarea
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Broadcast to the drift..."
                className="w-full bg-transparent text-[15px] text-gray-200 placeholder-gray-700 outline-none resize-none pt-2 min-h-[60px] leading-relaxed"
              />
              <AnimatePresence>
                {mediaPreview && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative mt-3 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                  >
                    <img src={mediaPreview} className="w-full h-auto max-h-[400px] object-cover" alt="preview" />
                    <button onClick={() => {setMediaPreview(null); setMediaFile(null);}} className="absolute top-3 right-3 bg-black/70 p-2.5 rounded-full text-white backdrop-blur-md hover:bg-rose-500 transition-colors">
                      <FaTimes size={12}/>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.03]">
            <div className="flex gap-5 text-gray-500 px-2">
               <div className="group cursor-pointer flex items-center gap-2" onClick={() => postMediaRef.current.click()}>
                 <FaImage size={18} className="group-hover:text-cyan-400 transition-colors" />
                 <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Photo</span>
               </div>
               <input type="file" ref={postMediaRef} onChange={handleMediaSelect} hidden accept="image/*,video/*" />
               <div className="group cursor-pointer flex items-center gap-2">
                 <FaVideo size={18} className="group-hover:text-purple-500 transition-colors" />
                 <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Video</span>
               </div>
            </div>
            <button 
              disabled={isSubmitting || (!postText.trim() && !mediaFile)}
              onClick={handlePostSubmit}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] active:scale-95 disabled:opacity-20 transition-all shadow-[0_10px_20px_rgba(6,182,212,0.2)]"
            >
              {isSubmitting ? "SYNCING..." : "BROADCAST"}
            </button>
          </div>
        </div>
      </section>

      {/* ৩. ফিড এরিয়া */}
      <section className="px-4 flex flex-col gap-4">
        <div className="flex items-center gap-4 px-2 mb-2">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.05]"></div>
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Neural Feed</h3>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/[0.05]"></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
            <p className="text-[10px] font-bold text-cyan-500/50 uppercase tracking-[0.3em] animate-pulse">Syncing Streams...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="flex flex-col gap-6">
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