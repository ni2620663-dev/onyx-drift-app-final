import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Link as LinkIcon, MapPin, MoreHorizontal, Verified, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  // API Base URL (আপনার সার্ভার ইউআরএল এখানে বসান)
  // Profile.jsx এর ভেতর
const API_BASE = "https://onyx-drift-api.onrender.com"; // আপনার আসল এপিআই ইউআরএল


  // States
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ১. ইউজার ডেটা এবং পোস্ট সার্ভার থেকে আনা
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ইউজার তথ্য আনা
        const userRes = await axios.get(`${API_BASE}/users/${username}`);
        setUser(userRes.data);
        setIsFollowing(userRes.data.isFollowing);
        
        // ইউজারের পোস্টগুলো আনা
        const postsRes = await axios.get(`${API_BASE}/users/${username}/posts`);
        setPosts(postsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  // ২. ফলো/আনফলো ফাংশন
  const handleFollowToggle = async () => {
    try {
      await axios.post(`${API_BASE}/users/${user._id}/follow`);
      setIsFollowing(!isFollowing);
      setUser(prev => ({
        ...prev,
        followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      }));
    } catch (error) {
      console.error("Follow action failed");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-cyan-500 font-mono tracking-tighter">INITIALIZING_NEURAL_PROFILE...</div>;
  if (!user) return <div className="p-10 text-center text-white">User not found in Neural Grid</div>;

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-zinc-800 pb-20">
      
      {/* হেডার */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md flex items-center px-4 py-1 gap-8 border-b border-zinc-900/50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-900 rounded-full transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold">{user.displayName}</h1>
            {user.isVerified && <Verified size={18} className="text-cyan-400 fill-cyan-400" />}
          </div>
          <span className="text-xs text-zinc-500">{posts.length} Posts</span>
        </div>
      </header>

      {/* প্রোফাইল ব্যানার ও অবতার */}
      <div className="relative h-48 bg-zinc-900 overflow-hidden">
        {user.coverImg && <img src={user.coverImg} alt="cover" className="w-full h-full object-cover" />}
      </div>

      <div className="px-4 relative mb-4">
        <div className="flex justify-between items-start">
          <div className="relative -mt-16">
            <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-black">
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
             <button className="p-2 border border-zinc-700 rounded-full hover:bg-zinc-900 transition"><MoreHorizontal size={20} /></button>
             {/* যদি নিজের প্রোফাইল হয় তবে Edit দেখাবে, অন্য কারো হলে Follow */}
             {user.isMe ? (
                <button onClick={() => setIsEditModalOpen(true)} className="px-5 py-1.5 border border-zinc-700 rounded-full font-bold hover:bg-zinc-900">Edit profile</button>
             ) : (
                <button 
                  onClick={handleFollowToggle}
                  className={`px-5 py-1.5 rounded-full font-bold transition-all ${isFollowing ? "border border-zinc-700 hover:text-red-500 hover:bg-red-500/10" : "bg-white text-black"}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
             )}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-extrabold">{user.displayName}</h2>
          <p className="text-zinc-500">@{user.username}</p>
        </div>

        <p className="mt-3 text-[15px] leading-relaxed">{user.bio}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-zinc-500 text-sm">
          {user.location && <div className="flex items-center gap-1"><MapPin size={16} />{user.location}</div>}
          <div className="flex items-center gap-1"><Calendar size={16} />Joined {user.joinedAt}</div>
        </div>

        <div className="flex gap-5 mt-4 text-sm font-normal">
          <p className="hover:underline cursor-pointer font-bold">{user.followingCount} <span className="text-zinc-500 font-normal">Following</span></p>
          <p className="hover:underline cursor-pointer font-bold">{user.followersCount} <span className="text-zinc-500 font-normal">Followers</span></p>
        </div>
      </div>

      {/* ট্যাব বার */}
      <div className="flex border-b border-zinc-800 sticky top-[53px] bg-black/80 backdrop-blur-md z-30">
        {['Posts', 'Replies', 'Media', 'Likes'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-sm font-bold relative ${activeTab === tab ? 'text-white' : 'text-zinc-500'}`}>
            {tab}
            {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-cyan-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* পোস্ট ফিড */}
      <div className="divide-y divide-zinc-800">
        {posts.length > 0 ? posts.map((post) => (
          <div key={post._id} className="p-4 flex gap-3 hover:bg-white/[0.02] transition cursor-pointer">
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="font-bold">{user.displayName}</span>
                <span className="text-zinc-500 text-sm">@{user.username} · {post.createdAt}</span>
              </div>
              <p className="text-sm mt-1">{post.content}</p>
              {post.image && <img src={post.image} className="mt-3 rounded-2xl border border-zinc-800 w-full object-cover max-h-80" alt="" />}
            </div>
          </div>
        )) : (
          <div className="p-20 text-center text-zinc-600">No posts found in this frequency.</div>
        )}
      </div>

      {/* ৩. এডিট প্রোফাইল মডাল */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-500/20 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-black w-full max-w-lg rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-6">
                  <button onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
                  <h2 className="text-xl font-bold">Edit profile</h2>
                </div>
                <button className="px-4 py-1.5 bg-white text-black rounded-full font-bold">Save</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="relative h-32 bg-zinc-900 rounded-lg">
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">কভার পরিবর্তন</div>
                </div>
                <div className="space-y-4">
                   <input className="w-full bg-transparent border border-zinc-800 p-3 rounded focus:border-cyan-500 outline-none" placeholder="Name" defaultValue={user.displayName} />
                   <textarea className="w-full bg-transparent border border-zinc-800 p-3 rounded focus:border-cyan-500 outline-none h-24" placeholder="Bio" defaultValue={user.bio} />
                   <input className="w-full bg-transparent border border-zinc-800 p-3 rounded focus:border-cyan-500 outline-none" placeholder="Location" defaultValue={user.location} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
