import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaTimes, FaMusic, FaMagic,
  FaCloudUploadAlt, FaImage, FaVideo, FaRegSmile, FaEllipsisH, FaPaperPlane
} from 'react-icons/fa';
import { HiMenuAlt3 } from 'react-icons/hi'; 
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; // Navigation এর জন্য যুক্ত করা হয়েছে
import PostCard from "../components/PostCard"; 

const PremiumHomeFeed = ({ searchQuery }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate(); // Navigation হুক
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedPostMedia, setSelectedPostMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); 
  const postFileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  // মেনু ক্লিক হ্যান্ডেলার
  const handleMenuClick = (path) => {
    navigate(path);
    setIsSidebarOpen(false); // ক্লিক করলে ড্রয়ার বন্ধ হবে
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this signal?")) {
      try {
        const token = await getAccessTokenSilently();
        await axios.delete(`${API_URL}/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
      } catch (err) {
        alert("Action Denied: You can only delete your own signals!");
      }
    }
  };

  const [stories, setStories] = useState(() => {
    const savedStories = localStorage.getItem('user_stories');
    const currentTime = Date.now();
    if (savedStories) {
      const parsed = JSON.parse(savedStories);
      return parsed.filter(s => (currentTime - s.timestamp) < 86400000);
    }
    return [{ id: 1, img: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=500", name: "Alex", timestamp: currentTime, filterClass: "" }];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState("none");

  const fileInputRef = useRef(null);
  const filters = [
    { name: "none", class: "" },
    { name: "Cyber", class: "hue-rotate-90 saturate-150 contrast-125" },
    { name: "Mono", class: "grayscale brightness-110" },
    { name: "Warm", class: "sepia brightness-90 saturate-150" },
  ];

  const handlePostMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPostMedia(reader.result);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !selectedPostMedia) return;
    try {
      const token = await getAccessTokenSilently();
      const newPost = {
        text: postText,
        media: selectedPostMedia,
        mediaType: mediaType || 'text',
        authorName: user.name,
        authorAvatar: user.picture,
        authorId: user.sub
      };
      await axios.post(`${API_URL}/api/posts`, newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPostText("");
      setSelectedPostMedia(null);
      setMediaType(null);
      fetchPosts();
    } catch (err) {
      alert("Something went wrong while posting.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    const newStory = {
      id: Date.now(),
      img: selectedImage,
      name: user?.nickname || "You",
      timestamp: Date.now(),
      filterClass: filters.find(f => f.name === activeFilter).class,
    };
    const updatedStories = [newStory, ...stories];
    setStories(updatedStories);
    localStorage.setItem('user_stories', JSON.stringify(updatedStories));
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="w-full min-h-screen bg-transparent space-y-4 md:space-y-6 pb-24 overflow-x-hidden relative">
      
      {/* মোবাইল ড্রয়ার বাটন */}
      <div className="md:hidden flex justify-between items-center px-4 pt-4">
        <h1 className="text-xl font-black text-white italic tracking-tighter">ONYX<span className="text-cyan-400">DRIFT</span></h1>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-white/5 border border-white/10 rounded-xl text-cyan-400 active:scale-90 transition-all"
        >
          <HiMenuAlt3 size={24} />
        </button>
      </div>

      {/* ড্রয়ার ওভারলে */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* স্লাইড আউট সাইডবার (অ্যাকশনসহ) */}
      <aside className={`
        fixed top-0 left-0 h-full w-[290px] bg-[#020617] border-r border-white/10 z-[1001]
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <span className="text-cyan-400 font-black tracking-widest text-[10px]">NEURAL MENU</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-white/50"><FaTimes size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <nav className="space-y-1">
            {/* FEED */}
            <div 
              onClick={() => handleMenuClick('/')}
              className="flex items-center gap-4 p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 cursor-pointer active:scale-95 transition-all"
            >
              <FaPlus size={14} />
              <span className="font-bold uppercase text-[11px] tracking-widest">Feed</span>
            </div>

            {/* ANALYTICS */}
            <div 
              onClick={() => handleMenuClick('/analytics')}
              className="flex items-center gap-4 p-4 text-gray-400 hover:bg-white/5 rounded-2xl transition-all cursor-pointer active:scale-95 group"
            >
              <FaMagic size={16} />
              <span className="font-bold uppercase text-[11px] tracking-widest">Analytics</span>
            </div>

            {/* MESSAGES */}
            <div 
              onClick={() => handleMenuClick('/messages')}
              className="flex items-center gap-4 p-4 text-gray-400 hover:bg-white/5 rounded-2xl transition-all cursor-pointer active:scale-95 group"
            >
              <FaPaperPlane size={16} />
              <span className="font-bold uppercase text-[11px] tracking-widest">Messages</span>
            </div>

            {/* EXPLORE */}
            <div 
              onClick={() => handleMenuClick('/explore')}
              className="flex items-center gap-4 p-4 text-gray-400 hover:bg-white/5 rounded-2xl transition-all cursor-pointer active:scale-95 group"
            >
              <FaImage size={16} />
              <span className="font-bold uppercase text-[11px] tracking-widest">Explore</span>
            </div>

            {/* SETTINGS */}
            <div 
              onClick={() => handleMenuClick('/settings')}
              className="flex items-center gap-4 p-4 text-gray-400 hover:bg-white/5 rounded-2xl transition-all cursor-pointer active:scale-95 group"
            >
              <FaEllipsisH size={16} />
              <span className="font-bold uppercase text-[11px] tracking-widest">Settings</span>
            </div>
          </nav>

          {/* ONYX PRO CARD */}
          <div className="mt-8 p-5 bg-gradient-to-br from-cyan-500/20 to-purple-500/10 rounded-[2rem] border border-white/10 relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">Onyx Pro</span>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Level up your neural experience today.</p>
              <button 
                onClick={() => handleMenuClick('/upgrade')}
                className="mt-4 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest active:bg-cyan-500 active:text-black transition-all"
              >
                Upgrade System
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* স্টোরি সেকশন */}
      <section className="px-3 md:px-4 pt-2 md:pt-4">
        <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 no-scrollbar items-center">
          <div onClick={() => setIsModalOpen(true)} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center bg-cyan-500/5 hover:bg-cyan-500/20 transition-all">
              <FaPlus className="text-cyan-400 text-lg md:text-xl" />
            </div>
            <span className="text-[10px] font-bold uppercase text-cyan-400 mt-1">Story</span>
          </div>

          {stories.map((s) => (
            <div key={s.id} onClick={() => setViewingStory(s)} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 to-pink-500">
                <div className="w-full h-full rounded-full border-2 border-[#020617] overflow-hidden bg-gray-900">
                  <img src={s.img} className={`w-full h-full object-cover ${s.filterClass}`} alt="" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-gray-400">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* পোস্ট ইনপুট বক্স */}
      <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 mx-3 md:mx-4">
        <div className="flex items-start gap-3 md:gap-4 mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shrink-0">
            <img src={user?.picture || "https://i.pravatar.cc/150"} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <div className="flex-1">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={`What's on your mind?`}
              className="w-full bg-white/5 rounded-xl md:rounded-2xl border border-white/10 px-4 py-3 text-xs md:text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-all resize-none min-h-[50px]"
            />

            <AnimatePresence>
              {selectedPostMedia && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
                  className="mt-3 relative rounded-xl overflow-hidden border border-white/10 aspect-video w-full max-w-sm bg-black">
                  <button onClick={() => setSelectedPostMedia(null)} className="absolute top-2 right-2 z-10 p-2 bg-black/60 rounded-full text-white"><FaTimes size={10}/></button>
                  {mediaType === 'video' ? <video src={selectedPostMedia} className="w-full h-full object-cover" controls /> : <img src={selectedPostMedia} className="w-full h-full object-cover" alt="" />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-white/5 gap-3">
          <input type="file" ref={postFileInputRef} onChange={handlePostMediaChange} accept="image/*,video/*" hidden />
          <div className="flex gap-2 w-full justify-between sm:justify-start">
            <button onClick={() => postFileInputRef.current.click()} className="flex items-center gap-2 text-[10px] font-bold text-orange-400 p-2 rounded-xl hover:bg-orange-400/10"><FaImage /> Photo</button>
            <button onClick={() => postFileInputRef.current.click()} className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 p-2 rounded-xl hover:bg-cyan-400/10"><FaVideo /> Video</button>
            <button className="flex items-center gap-2 text-[10px] font-bold text-purple-400 p-2 rounded-xl hover:bg-purple-400/10"><FaRegSmile /> Feeling</button>
          </div>

          <button 
            disabled={!postText.trim() && !selectedPostMedia}
            onClick={handlePostSubmit}
            className="w-full sm:w-auto bg-cyan-500 text-black text-[10px] font-black uppercase px-6 py-2 rounded-xl shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Post <FaPaperPlane size={10}/>
          </button>
        </div>
      </section>

      {/* নিউজ ফিড */}
      <section className="space-y-4 md:space-y-6 px-3 md:px-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 px-2">Neural Feed</h2>
        {loading ? (
          <div className="text-center py-10 text-gray-500 text-[10px] animate-pulse font-black uppercase tracking-[0.3em]">Connecting...</div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              onDelete={() => handleDeletePost(post._id)}
              currentUserId={user?.sub} 
              onAction={fetchPosts} 
            />
          ))
        )}
      </section>

      {/* মোডালসমূহ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="relative w-full max-sm:max-w-[90%] max-w-sm aspect-[9/16] bg-[#0b1120] rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col shadow-2xl">
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {selectedImage ? (
                  <>
                    <img src={selectedImage} className={`w-full h-full object-cover ${filters.find(f => f.name === activeFilter).class}`} alt="" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 bg-black/20 p-3 rounded-full border border-white/5 backdrop-blur-md">
                      <button onClick={() => {
                        const nextIdx = (filters.findIndex(f => f.name === activeFilter) + 1) % filters.length;
                        setActiveFilter(filters[nextIdx].name);
                      }} className="p-2 text-white"><FaMagic /></button>
                    </div>
                  </>
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-4 cursor-pointer">
                    <FaCloudUploadAlt className="text-4xl text-cyan-500" />
                    <p className="text-[10px] font-black text-gray-500 uppercase">Select Signal</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} hidden accept="image/*" />
              <div className="p-6 flex items-center gap-4 bg-[#0b1120] border-t border-white/5">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 text-[10px] font-black uppercase text-gray-400">Abort</button>
                <button onClick={handleUpload} disabled={!selectedImage} className="flex-1 py-4 bg-cyan-500 rounded-2xl text-[10px] font-black uppercase text-black">Broadcast</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md h-full bg-black">
              <div className="absolute top-6 inset-x-4 h-1 bg-white/20 rounded-full overflow-hidden z-[620]">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear" }} onAnimationComplete={() => setViewingStory(null)} className="h-full bg-cyan-400" />
              </div>
              <button onClick={() => setViewingStory(null)} className="absolute top-10 right-6 z-[620] p-2 bg-white/10 rounded-full text-white"><FaTimes /></button>
              <img src={viewingStory.img} className={`w-full h-full object-cover ${viewingStory.filterClass}`} alt="" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHomeFeed;