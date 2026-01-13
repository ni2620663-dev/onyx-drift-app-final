import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaImage, FaVideo, FaPaperPlane, FaSearch, FaRegBell } from 'react-icons/fa'; 
import { HiOutlineSparkles, HiOutlineMenuAlt4 } from "react-icons/hi"; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import { io } from "socket.io-client"; 
import PostCard from "../components/PostCard"; 

const PremiumHomeFeed = () => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate(); 
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const [selectedPostMedia, setSelectedPostMedia] = useState(null);
  const [mediaFile, setMediaFile] = useState(null); 
  const [mediaType, setMediaType] = useState(null); 
  const postFileInputRef = useRef(null);
  const socketRef = useRef(null); 

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  // Socket and Fetch logic remains same to ensure functionality
  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = io(API_URL, { transports: ["websocket", "polling"], path: "/socket.io/", withCredentials: true });
      socketRef.current.on("receiveNewPost", (newPost) => { setPosts((prev) => [newPost, ...prev]); });
      return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }
  }, [isAuthenticated, API_URL]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts?t=${Date.now()}`);
      setPosts(response.data);
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    try {
      const token = await getAccessTokenSilently();
      const postData = { text: postText, authorName: user?.nickname || "Drifter", authorAvatar: user?.picture || "", authorId: user?.sub, media: selectedPostMedia, mediaType: mediaType };
      await axios.post(`${API_URL}/api/posts`, postData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      setPostText(""); setSelectedPostMedia(null); setMediaFile(null);
      fetchPosts(); 
    } catch (err) { alert("Broadcast failed."); }
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] text-white pb-32 overflow-x-hidden">
      
      {/* ১. টপ হেডার (পরিষ্কার এবং বড় লোগো) */}
      <header className="sticky top-0 z-[100] bg-black border-b border-white/[0.05] px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <HiOutlineMenuAlt4 size={26} className="text-white" />
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
              ONYX<span className="text-cyan-500">DRIFT</span>
            </h1>
        </div>
        <div className="flex items-center gap-6">
          <FaSearch size={20} className="text-gray-400" />
          <div className="relative">
            <FaRegBell size={22} className="text-gray-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-black"></span>
          </div>
        </div>
      </header>

      {/* ২. স্টোরি সেকশন (ফুল স্ক্রিন স্লাইডার) */}
      <section className="py-6 overflow-x-auto no-scrollbar border-b border-white/[0.03]">
        <div className="flex gap-5 px-5 items-center">
          {/* নিজের স্টোরি */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center relative">
              <img src={user?.picture} className="w-[62px] h-[62px] rounded-full object-cover opacity-40" alt="" />
              <div className="absolute bottom-0 right-0 bg-white text-black rounded-full p-1 border-4 border-black">
                <FaPlus size={10} strokeWidth={4} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Your Story</span>
          </div>
          {/* ফ্রেন্ডস স্টোরি */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-600 to-pink-500 shadow-lg shadow-cyan-500/10">
                <div className="bg-black p-[2px] rounded-full">
                  <img src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-[60px] h-[60px] rounded-full object-cover" alt="" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">User_{i}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ৩. পোস্ট ইনপুট বক্স (মডার্ন রাউন্ডেড ডিজাইন) */}
      <section className="px-4 py-6">
        <div className={`transition-all duration-300 border rounded-[2.5rem] p-5 ${isFocused ? "bg-black border-cyan-500/40 shadow-2xl" : "bg-[#0A0A0A] border-white/5"}`}>
          <div className="flex gap-4">
            <img src={user?.picture} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
            <div className="flex-1">
              <textarea
                value={postText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-[16px] text-gray-200 placeholder-gray-700 outline-none resize-none min-h-[60px] pt-1"
              />
            </div>
            <button onClick={() => {}} className="p-2 text-cyan-500/50 hover:text-cyan-400 transition-colors">
              <HiOutlineSparkles size={26} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.03]">
            <div className="flex gap-2">
              <button onClick={() => postFileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl text-[12px] font-bold text-gray-400">
                <FaImage className="text-orange-500" /> Photo
              </button>
              <button onClick={() => postFileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl text-[12px] font-bold text-gray-400">
                <FaVideo className="text-cyan-500" /> Video
              </button>
            </div>
            <input type="file" ref={postFileInputRef} hidden accept="image/*,video/*" />
            
            <button 
              disabled={!postText.trim()}
              onClick={handlePostSubmit}
              className="bg-cyan-600 text-white px-6 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest disabled:opacity-10 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
            >
              POST
            </button>
          </div>
        </div>
      </section>

      {/* ৪. ফুল স্ক্রিন পোস্ট ফিড */}
      <section className="space-y-4">
        <div className="px-6 flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">Neural Feed</h2>
            <div className="h-[1px] flex-1 ml-4 bg-white/5"></div>
        </div>

        {loading ? (
          <div className="text-center py-20 opacity-30">
             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Nodes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1"> {/* পোস্টগুলো ফুল স্ক্রিন জুড়ে দেখাবে */}
            {posts.map(post => (
              <PostCard 
                key={post._id || post.id} 
                post={post} 
                onAction={fetchPosts} 
                currentUserId={user?.sub}
                onUserClick={(id) => navigate(`/profile/${id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PremiumHomeFeed;