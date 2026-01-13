import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaTimes, FaMagic,
  FaImage, FaVideo, FaRegSmile, FaPaperPlane, FaSearch
} from 'react-icons/fa'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import { io } from "socket.io-client"; 
import PostCard from "../components/PostCard"; 
import { HiOutlineSparkles } from "react-icons/hi2"; 

const PremiumHomeFeed = () => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate(); 
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [selectedPostMedia, setSelectedPostMedia] = useState(null);
  const [mediaFile, setMediaFile] = useState(null); 
  const [mediaType, setMediaType] = useState(null); 
  const postFileInputRef = useRef(null);
  const socketRef = useRef(null); 

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  // AI Caption Logic
  const handleAICaption = async () => {
    if (!postText.trim()) return;
    setAiLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const { data } = await axios.post(`${API_URL}/api/communities/generate-caption`, 
        { prompt: postText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPostText(data.captions);
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    if (userId) navigate(`/following?userId=${encodeURIComponent(userId)}`);
  };

  // Socket setup
  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = io(API_URL, { transports: ["websocket", "polling"], path: "/socket.io/", withCredentials: true });
      socketRef.current.on("receiveNewPost", (newPost) => {
        setPosts((prevPosts) => [newPost, ...prevPosts]);
      });
      return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }
  }, [isAuthenticated, API_URL]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts?t=${Date.now()}`);
      setPosts(response.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDeletePost = async (postId) => {
    if (window.confirm("Terminate this signal?")) {
      try {
        const token = await getAccessTokenSilently();
        await axios.delete(`${API_URL}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(prevPosts => prevPosts.filter(p => (p._id || p.id) !== postId));
      } catch (err) {
        alert("Action Denied!");
      }
    }
  };

  // Stories Logic
  const [stories, setStories] = useState(() => {
    const saved = localStorage.getItem('user_stories');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.filter(s => (Date.now() - s.timestamp) < 86400000);
    }
    return [{ id: 1, img: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=500", name: "Alex", timestamp: Date.now() }];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handlePostMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPostMedia(reader.result);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    try {
      const token = await getAccessTokenSilently();
      const postData = {
        text: postText,
        authorName: user?.nickname || user?.name || "Drifter",
        authorAvatar: user?.picture || "",
        authorId: user?.sub, 
        media: selectedPostMedia,
        mediaType: mediaType
      };
      await axios.post(`${API_URL}/api/posts`, postData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setPostText(""); setSelectedPostMedia(null); setMediaFile(null);
      fetchPosts(); 
    } catch (err) {
      alert("Broadcast failed.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-24 overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* ১. টপ হেডার (Unique Minimal) */}
      <header className="sticky top-0 z-[100] bg-black/80 backdrop-blur-xl border-b border-[#1A1A1A] px-5 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">
          ONYX<span className="text-cyan-400">DRIFT</span>
        </h1>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-gray-400 border border-[#222]">
            <FaSearch size={16} />
          </button>
          <img src={user?.picture} className="w-9 h-9 rounded-full border border-cyan-500/50" alt="me" />
        </div>
      </header>

      {/* ২. স্টোরি সেকশন (Minimal Circular) */}
      <section className="py-6 border-b border-[#1A1A1A]">
        <div className="flex gap-5 overflow-x-auto px-5 no-scrollbar items-center">
          <div onClick={() => setIsModalOpen(true)} className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#333] flex items-center justify-center bg-[#050505] hover:border-cyan-500 transition-colors">
              <FaPlus className="text-gray-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Your Story</span>
          </div>
          {stories.map((s) => (
            <div key={s.id} onClick={() => setViewingStory(s)} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 to-purple-600">
                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden">
                  <img src={s.img} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-gray-400">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ৩. পোস্ট ইনপুট বক্স (Image style matching) */}
      <section className="m-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2.5rem] p-6 shadow-2xl">
        <div className="flex gap-4">
          <img src={user?.picture} className="w-12 h-12 rounded-2xl object-cover" alt="" />
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-[15px] text-white placeholder-[#444] outline-none resize-none min-h-[60px]"
              />
              <button onClick={handleAICaption} className="absolute right-0 bottom-0 p-2 text-cyan-400 hover:scale-110 transition-transform">
                <HiOutlineSparkles size={22} className={aiLoading ? "animate-spin" : ""} />
              </button>
            </div>
            
            <AnimatePresence>
              {selectedPostMedia && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 relative rounded-3xl overflow-hidden border border-[#222]">
                  <button onClick={() => setSelectedPostMedia(null)} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white backdrop-blur-md"><FaTimes size={12}/></button>
                  {mediaType === 'video' ? <video src={selectedPostMedia} className="w-full max-h-[300px] object-cover" controls /> : <img src={selectedPostMedia} className="w-full max-h-[300px] object-cover" alt="" />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#1A1A1A]">
          <div className="flex gap-2">
            <button onClick={() => postFileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-full text-[11px] font-bold text-gray-400 hover:text-white transition-colors">
              <FaImage className="text-orange-500" /> Photo
            </button>
            <button onClick={() => postFileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-[#111] rounded-full text-[11px] font-bold text-gray-400 hover:text-white transition-colors">
              <FaVideo className="text-cyan-500" /> Video
            </button>
          </div>
          <input type="file" ref={postFileInputRef} onChange={handlePostMediaChange} hidden accept="image/*,video/*" />
          
          <button 
            disabled={!postText.trim() && !mediaFile}
            onClick={handlePostSubmit}
            className="bg-cyan-500 text-black px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-90 disabled:opacity-20 transition-all"
          >
            Post <FaPaperPlane className="inline ml-1" size={10}/>
          </button>
        </div>
      </section>

      {/* ৪. পোস্ট ফিড (Neural Feed) */}
      <section className="px-4 space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#444] px-2 mb-4">Neural Broadcasts</h2>
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
             <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Syncing Feed...</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post._id || post.id} 
              post={post} 
              onDelete={() => handleDeletePost(post._id || post.id)}
              currentUserId={user?.sub} 
              onAction={fetchPosts} 
              onUserClick={handleUserClick} 
            />
          ))
        )}
      </section>

      {/* ৫. স্টোরি ভিউয়ার এবং মোডাল (Black Blur) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-sm aspect-[9/16] bg-[#050505] rounded-[3rem] overflow-hidden border border-[#222] flex flex-col">
                <div className="flex-1 flex items-center justify-center relative">
                   {selectedImage ? (
                      <img src={selectedImage} className="w-full h-full object-cover" />
                   ) : (
                      <div onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-4 cursor-pointer group">
                        <div className="w-20 h-20 rounded-full bg-[#111] flex items-center justify-center border border-[#222] group-hover:border-cyan-500 transition-colors">
                           <FaPlus className="text-2xl text-gray-500" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 uppercase">Select Signal</p>
                      </div>
                   )}
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                   const file = e.target.files[0];
                   if(file) {
                     const reader = new FileReader();
                     reader.onload = () => setSelectedImage(reader.result);
                     reader.readAsDataURL(file);
                   }
                }} hidden />
                <div className="p-8 flex gap-4 bg-black">
                   <button onClick={() => {setIsModalOpen(false); setSelectedImage(null);}} className="flex-1 text-[11px] font-bold uppercase text-gray-500">Abort</button>
                   <button onClick={() => {
                     const newSt = { id: Date.now(), img: selectedImage, name: "You", timestamp: Date.now() };
                     setStories([newSt, ...stories]);
                     setIsModalOpen(false);
                   }} disabled={!selectedImage} className="flex-1 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-10">Broadcast</button>
                </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;