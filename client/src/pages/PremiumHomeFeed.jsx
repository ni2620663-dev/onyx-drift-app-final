import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaImage, FaVideo, FaSearch, FaRegBell } from 'react-icons/fa'; 
import { HiOutlineMenuAlt4 } from "react-icons/hi"; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
import { io } from "socket.io-client"; 
import PostCard from "../components/PostCard"; 

// searchQuery প্রপস রিসিভ করা হয়েছে
const PremiumHomeFeed = ({ searchQuery = "" }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate(); 
  
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [stories, setStories] = useState([
    { id: 1, name: 'Alex', img: 'https://i.pravatar.cc/150?u=11', content: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400' },
    { id: 2, name: 'Jordan', img: 'https://i.pravatar.cc/150?u=12', content: 'https://images.unsplash.com/photo-1557683316-973673baf926' },
  ]);
  const [viewingStory, setViewingStory] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewStoryImage, setPreviewStoryImage] = useState(null);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const storyInputRef = useRef(null);
  const postMediaRef = useRef(null);
  const socketRef = useRef(null);

  // --- Socket.io Connection ---
  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = io(API_URL, { 
        transports: ["polling", "websocket"],
        path: "/socket.io/" 
      });
      
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
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // --- Search Filtering ---
  const filteredPosts = posts.filter((post) => {
    const term = searchQuery.toLowerCase();
    return (
      post.authorName?.toLowerCase().includes(term) || 
      post.text?.toLowerCase().includes(term)
    );
  });

  // --- Post Submission ---
  const handlePostSubmit = async () => {
    if (!postText.trim() && !mediaFile) return;
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("text", postText);
      if (mediaFile) formData.append("media", mediaFile);
      formData.append("authorName", user?.nickname || "User");
      formData.append("authorAvatar", user?.picture || "");
      formData.append("auth0Id", user?.sub || "");

      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
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

  // Media Select Logic
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
      
      {/* ১. মোবাইল হেডার (শুধুমাত্র ছোট স্ক্রিনে দেখাবে এবং App.js এর Navbar এর সাথে সামঞ্জস্য রাখবে) */}
      <header className="lg:hidden sticky top-0 z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <HiOutlineMenuAlt4 size={26} className="text-white" />
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">
              ONYX<span className="text-cyan-500">DRIFT</span>
            </h1>
        </div>
        <div className="flex items-center gap-6 text-gray-400">
          <FaSearch size={20} />
          <FaRegBell size={22} />
        </div>
      </header>

      {/* ২. স্টোরি সেকশন */}
      <section className="py-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-5 px-6 items-center">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div onClick={() => storyInputRef.current.click()} className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center bg-white/5 relative cursor-pointer group">
              <img src={user?.picture} className="w-[62px] h-[62px] rounded-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="" />
              <div className="absolute bottom-0 right-0 bg-cyan-500 text-black rounded-full p-1 border-4 border-black">
                <FaPlus size={10} strokeWidth={4} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Story</span>
            <input type="file" ref={storyInputRef} onChange={(e) => {
               const file = e.target.files[0];
               if(file) {
                 const reader = new FileReader();
                 reader.onload = () => { setPreviewStoryImage(reader.result); setIsUploadModalOpen(true); };
                 reader.readAsDataURL(file);
               }
            }} hidden accept="image/*" />
          </div>

          {stories.map((s) => (
            <div key={s.id} onClick={() => setViewingStory(s)} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-600 to-rose-500">
                <div className="bg-black p-[2px] rounded-full">
                  <img src={s.img} className="w-[60px] h-[60px] rounded-full object-cover" alt="" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ৩. পোস্ট ইনপুট বক্স */}
      <section className="px-4 py-2">
        <div className={`transition-all duration-300 border rounded-[2.5rem] p-5 ${isFocused ? "bg-white/[0.02] border-cyan-500/30 shadow-[0_0_50px_-12px_rgba(6,182,212,0.2)]" : "bg-white/[0.02] border-white/5"}`}>
          <div className="flex gap-4">
            <img src={user?.picture} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
            <div className="flex-1">
                <textarea
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Broadcast to the drift..."
                  className="w-full bg-transparent text-[15px] text-gray-200 placeholder-gray-700 outline-none resize-none pt-2 min-h-[60px]"
                />
                {mediaPreview && (
                    <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10">
                        <img src={mediaPreview} className="w-full h-48 object-cover" alt="preview" />
                        <button onClick={() => {setMediaPreview(null); setMediaFile(null);}} className="absolute top-3 right-3 bg-black/70 p-2 rounded-full hover:bg-rose-500 transition-colors"><FaTimes size={12}/></button>
                    </div>
                )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.03]">
            <div className="flex gap-5 text-gray-500">
               <FaImage onClick={() => postMediaRef.current.click()} size={20} className="hover:text-cyan-400 cursor-pointer transition-colors" />
               <input type="file" ref={postMediaRef} onChange={handleMediaSelect} hidden accept="image/*,video/*" />
               <FaVideo size={20} className="hover:text-purple-500 cursor-pointer transition-colors" />
            </div>
            <button 
                disabled={isSubmitting || (!postText.trim() && !mediaFile)}
                onClick={handlePostSubmit}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-30 transition-all"
            >
                {isSubmitting ? "Syncing..." : "Post"}
            </button>
          </div>
        </div>
      </section>

      {/* ৪. ফিড */}
      <section className="flex flex-col gap-4 mt-6">
        {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Neural Link Syncing...</p>
            </div>
        ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
                <PostCard key={post._id} post={post} onAction={fetchPosts} currentUserId={user?.sub} />
            ))
        ) : (
            <div className="text-center py-20 opacity-30 italic text-sm">No signals found in this sector...</div>
        )}
      </section>

      {/* ৫. স্টোরি প্রিভিউ ও আপলোড মোডাল (অপরিবর্তিত থাকবে) */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black">
             {/* ... (আপনার আগের মোডাল কোড) ... */}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PremiumHomeFeed;