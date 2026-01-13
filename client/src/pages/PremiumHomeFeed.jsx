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
  
  // States
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [stories, setStories] = useState([
    { id: 1, name: 'Alex', img: 'https://i.pravatar.cc/150?u=11', content: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400' },
    { id: 2, name: 'Jordan', img: 'https://i.pravatar.cc/150?u=12', content: 'https://images.unsplash.com/photo-1557683316-973673baf926' },
  ]);

  // Story States
  const [viewingStory, setViewingStory] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewStoryImage, setPreviewStoryImage] = useState(null);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const storyInputRef = useRef(null);

  // --- Story Functions ---
  const handleStorySelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewStoryImage(reader.result);
        setIsUploadModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadStory = () => {
    const newStory = {
      id: Date.now(),
      name: user?.nickname || 'You',
      img: user?.picture,
      content: previewStoryImage,
    };
    setStories([newStory, ...stories]);
    setIsUploadModalOpen(false);
    setPreviewStoryImage(null);
  };

  // --- Post Fetching (Logic remains) ---
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts?t=${Date.now()}`);
      setPosts(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white pb-32">
      
      {/* ১. ক্লিন হেডার (লাল মার্ক করা অংশটি বাদ দেওয়া হয়েছে) */}
      <header className="sticky top-0 z-[100] bg-black border-b border-white/5 px-6 py-5 flex items-center justify-between">
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
      <section className="py-6 border-b border-white/[0.03] overflow-x-auto no-scrollbar">
        <div className="flex gap-5 px-6 items-center">
          {/* স্টোরি অ্যাড বাটন */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div 
              onClick={() => storyInputRef.current.click()}
              className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center bg-white/5 relative cursor-pointer"
            >
              <img src={user?.picture} className="w-[62px] h-[62px] rounded-full object-cover opacity-30" alt="" />
              <div className="absolute bottom-0 right-0 bg-white text-black rounded-full p-1 border-4 border-black">
                <FaPlus size={10} strokeWidth={4} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Story</span>
            <input type="file" ref={storyInputRef} onChange={handleStorySelect} hidden accept="image/*" />
          </div>

          {/* স্টোরি লিস্ট */}
          {stories.map((s) => (
            <div key={s.id} onClick={() => setViewingStory(s)} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-600 to-rose-500 shadow-lg shadow-cyan-500/10">
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
      <section className="px-5 py-6">
        <div className={`transition-all duration-300 border rounded-[2.5rem] p-5 ${isFocused ? "bg-black border-cyan-500/30 shadow-2xl" : "bg-[#0A0A0A] border-white/5"}`}>
          <div className="flex gap-4">
            <img src={user?.picture} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
            <textarea
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent text-[16px] text-gray-200 placeholder-gray-700 outline-none resize-none pt-2"
            />
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.03]">
            <div className="flex gap-4 text-gray-500">
               <FaImage size={18} className="text-orange-500/70" />
               <FaVideo size={18} className="text-cyan-500/70" />
            </div>
            <button className="bg-cyan-600 px-6 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest active:scale-95 transition-all">POST</button>
          </div>
        </div>
      </section>

      {/* ৪. ফিড (Full Screen Feed) */}
      <section className="space-y-2">
        {posts.map(post => (
          <PostCard key={post._id} post={post} onAction={fetchPosts} currentUserId={user?.sub} />
        ))}
      </section>

      {/* --- ৫. স্টোরি প্রিভিউ মোডাল (Viewing) --- */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black"
          >
            <div className="absolute top-10 left-0 right-0 z-10 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={viewingStory.img} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                <span className="font-bold text-sm uppercase tracking-widest">{viewingStory.name}</span>
              </div>
              <FaTimes onClick={() => setViewingStory(null)} className="text-white/50 text-2xl cursor-pointer" />
            </div>
            <img src={viewingStory.content} className="w-full h-full object-cover" alt="story" />
            {/* অটো প্রোগ্রেস বার সিমুলেশন */}
            <div className="absolute top-2 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5 }} onAnimationComplete={() => setViewingStory(null)} className="h-full bg-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ৬. স্টোরি আপলোড মোডাল --- */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[2100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0A0A0A] w-full max-w-sm rounded-[3rem] border border-white/10 p-6 flex flex-col gap-6 text-center">
              <h3 className="text-lg font-black uppercase tracking-widest">New Story</h3>
              <div className="aspect-[9/16] rounded-3xl overflow-hidden border border-white/5">
                <img src={previewStoryImage} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-4 text-gray-500 font-bold uppercase text-xs">Cancel</button>
                <button onClick={uploadStory} className="flex-1 py-4 bg-cyan-500 text-black font-black uppercase text-xs rounded-2xl shadow-lg shadow-cyan-500/20">Broadcast</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PremiumHomeFeed;