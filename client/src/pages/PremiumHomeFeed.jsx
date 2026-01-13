import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaImage, FaVideo, FaSearch, FaRegBell } from 'react-icons/fa'; 
import { HiOutlineMenuAlt4 } from "react-icons/hi"; 
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

  const [stories] = useState([
    { id: 1, name: 'ALEX', img: 'https://i.pravatar.cc/150?u=11' },
    { id: 2, name: 'JORDAN', img: 'https://i.pravatar.cc/150?u=12' },
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
      formData.append("authorName", user?.nickname || "Drifter");
      formData.append("authorAvatar", user?.picture || "");
      formData.append("auth0Id", user?.sub || "");

      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      setPostText(""); setMediaFile(null); setMediaPreview(null);
      fetchPosts(); 
    } catch (err) { console.error("Post Error:", err); } finally { setIsSubmitting(false); }
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
    <div className="w-full min-h-screen bg-transparent text-white pb-24">
      
      {/* ১. ক্লিন হেডার (লোগো এবং নোটিফিকেশন) */}
      <header className="sticky top-0 z-[100] bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <HiOutlineMenuAlt4 size={24} className="text-gray-400" />
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            ONYX<span className="text-cyan-500">DRIFT</span>
          </h1>
        </div>
        <div className="flex items-center gap-5 text-gray-400">
          <FaSearch size={18} className="hover:text-white transition-colors" />
          <div className="relative">
            <FaRegBell size={20} className="hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full border-2 border-black"></span>
          </div>
        </div>
      </header>

      {/* ২. স্টোরি সেকশন (প্রিমিয়াম গ্রেডিয়েন্ট লুক) */}
      <section className="py-6 overflow-x-auto no-scrollbar border-b border-white/[0.02]">
        <div className="flex gap-5 px-6 items-center">
          {/* My Story */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div onClick={() => storyInputRef.current.click()} className="w-16 h-16 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center bg-white/5 relative cursor-pointer active:scale-90 transition-transform">
              <img src={user?.picture} className="w-14 h-14 rounded-full object-cover opacity-40" alt="" />
              <div className="absolute bottom-0 right-0 bg-cyan-500 text-black rounded-full p-1 border-[3px] border-[#030303]">
                <FaPlus size={8} strokeWidth={4} />
              </div>
            </div>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Story</span>
            <input type="file" ref={storyInputRef} hidden accept="image/*" />
          </div>

          {/* User Stories */}
          {stories.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group">
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-600 to-rose-500 group-active:scale-95 transition-transform">
                <div className="bg-[#030303] p-[2px] rounded-full">
                  <img src={s.img} className="w-14 h-14 rounded-full object-cover" alt="" />
                </div>
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ৩. পোস্ট ইনপুট (নিউরন স্টাইল) */}
      <section className="px-4 py-6">
        <div className={`transition-all duration-500 border rounded-[2rem] p-5 ${isFocused ? "bg-white/[0.03] border-cyan-500/20 shadow-2xl" : "bg-white/[0.01] border-white/[0.05]"}`}>
          <div className="flex gap-4">
            <img src={user?.picture} className="w-11 h-11 rounded-full object-cover border border-white/10" alt="" />
            <div className="flex-1">
              <textarea
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Broadcast to the drift..."
                className="w-full bg-transparent text-[14px] text-gray-200 placeholder-gray-800 outline-none resize-none pt-2 min-h-[50px]"
              />
              {mediaPreview && (
                <div className="relative mt-3 rounded-[1.5rem] overflow-hidden border border-white/10">
                  <img src={mediaPreview} className="w-full h-44 object-cover" alt="preview" />
                  <button onClick={() => {setMediaPreview(null); setMediaFile(null);}} className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white backdrop-blur-md"><FaTimes size={10}/></button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.03]">
            <div className="flex gap-6 text-gray-600">
               <FaImage onClick={() => postMediaRef.current.click()} size={18} className="hover:text-cyan-400 cursor-pointer transition-colors" />
               <input type="file" ref={postMediaRef} onChange={handleMediaSelect} hidden accept="image/*,video/*" />
               <FaVideo size={18} className="hover:text-purple-500 cursor-pointer transition-colors" />
            </div>
            <button 
              disabled={isSubmitting || (!postText.trim() && !mediaFile)}
              onClick={handlePostSubmit}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-20 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {isSubmitting ? "SYNCING..." : "POST"}
            </button>
          </div>
        </div>
      </section>

      {/* ৪. ফিড এরিয়া */}
      <section className="px-4 flex flex-col gap-2">
        <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2 px-2">Neural Broadcasts</h3>
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest tracking-[0.2em]">Syncing Feed...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard key={post._id} post={post} onAction={fetchPosts} />
          ))
        ) : (
          <div className="text-center py-20 opacity-20 italic text-xs tracking-widest">NO SIGNALS DETECTED</div>
        )}
      </section>

    </div>
  );
};

export default PremiumHomeFeed;