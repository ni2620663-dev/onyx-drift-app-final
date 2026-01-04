import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEdit, FaCalendarAlt, FaMapMarkerAlt, FaShieldAlt, 
  FaRocket, FaCamera, FaImage, FaFilm, FaPlayCircle, FaTimes, FaPlus, FaCheckCircle
} from "react-icons/fa";
import { BRAND_NAME } from "../utils/constants";
import PostCard from "../components/PostCard";

const Profile = () => {
  const { userId } = useParams(); 
  const { user: currentUser, getAccessTokenSilently } = useAuth0();
  
  // States
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Echoes");
  
  // Post & Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("photo"); 
  const [isTransmitting, setIsTransmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";
  const fileInputRef = useRef(null);

  // প্রোফাইল এডিটের স্টেটস
  const [editData, setEditData] = useState({ nickname: "", bio: "", location: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // এডিট মোডাল ওপেন করার সময় ডাটা সেট করা
  useEffect(() => {
    if (userProfile) {
      setEditData({
        nickname: userProfile.name || userProfile.nickname || "",
        bio: userProfile.bio || "",
        location: userProfile.location || ""
      });
    }
  }, [userProfile]);

  const fetchProfileData = async () => {
    try {
      const token = await getAccessTokenSilently();
      const rawId = userId || currentUser?.sub;
      const targetId = encodeURIComponent(rawId); 
      
      const profileRes = await axios.get(`${API_URL}/api/user/profile/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(profileRes.data);

      const postsRes = await axios.get(`${API_URL}/api/posts/user/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPosts(postsRes.data);
    } catch (err) {
      console.error("Neural Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser || userId) fetchProfileData();
  }, [userId, currentUser]);

  const handleUpdateIdentity = async () => {
    setIsUpdating(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("nickname", editData.nickname);
      formData.append("bio", editData.bio);
      formData.append("location", editData.location);
      
      // ব্যাকএন্ডের সাথে ফিল্ড নেম মিলানো হলো
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("cover", coverFile);

      await axios.put(`${API_URL}/api/user/update-profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Identity Synchronized!");
      setIsEditOpen(false);
      fetchProfileData(); 
    } catch (err) {
      console.error(err);
      alert("Sync Failed!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransmit = async () => {
    if (!content && !file) return alert("Neural transmission cannot be empty!");
    setIsTransmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("text", content);
      
      // FIX: 'type' এর বদলে ব্যাকএন্ডের 'mediaType' পাঠানো হচ্ছে
      formData.append("mediaType", postType); 
      
      // FIX: 'file' এর বদলে ব্যাকএন্ডের প্রত্যাশিত 'media' ফিল্ড ব্যবহার করা হলো
      if (file) formData.append("media", file);

      const res = await axios.post(`${API_URL}/api/posts/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      setUserPosts([res.data, ...userPosts]); 
      setIsCreateOpen(false);
      setContent("");
      setFile(null);
      alert("Echo Transmitted!");
    } catch (err) {
      console.error("Transmission Error:", err);
      alert("Transmission Interrupted!");
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleFileSelect = (type) => {
    setPostType(type);
    setTimeout(() => {
      fileInputRef.current.click();
    }, 100);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-400 font-black italic uppercase tracking-[0.5em]">
      SYNCING NEURAL IDENTITY...
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#020617] text-gray-200">
      
      {/* ১. ব্যানার সেকশন */}
      <div className="relative h-60 md:h-72 w-full overflow-hidden">
        <img 
          src={userProfile?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000"} 
          className="w-full h-full object-cover opacity-40"
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent"></div>
        <button onClick={() => setIsEditOpen(true)} className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:border-cyan-400 text-white transition-all">
          <FaCamera size={18} />
        </button>
      </div>

      {/* ২. প্রোফাইল ইনফো কার্ড */}
      <div className="max-w-[900px] mx-auto px-4 -mt-24 relative z-20">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative group">
                <img 
                  src={userProfile?.avatar || currentUser?.picture} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-[#020617] shadow-lg object-cover bg-[#0f172a]" 
                  alt="Avatar"
                />
                <button onClick={() => setIsEditOpen(true)} className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <FaCamera size={24}/>
                </button>
                {userProfile?.isPremium && <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-cyan-400 to-purple-600 p-2.5 rounded-2xl border-4 border-[#020617] shadow-lg"><FaShieldAlt className="text-white text-sm" /></div>}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {userProfile?.name || currentUser?.nickname}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/20 rounded-md text-[8px] font-black text-cyan-400 uppercase tracking-widest">{BRAND_NAME} PRO</span>
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">Verified Drifter</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsEditOpen(true)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-cyan-400 transition-all flex items-center gap-2"><FaEdit /> Edit Profile</button>
              <button onClick={() => setIsCreateOpen(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/20 flex items-center gap-2"><FaPlus /> New Echo</button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/5">
            <div className="col-span-2">
              <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-3">Neural Signature</h3>
              <p className="text-gray-400 text-sm leading-relaxed italic">"{userProfile?.bio || "Scanning the drift for meaning..."}"</p>
              <div className="flex flex-wrap gap-5 mt-6 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><FaMapMarkerAlt className="text-cyan-400" /> {userProfile?.location || "Unknown Sector"}</span>
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><FaCalendarAlt className="text-purple-500" /> Joined 2026</span>
              </div>
            </div>
            <div className="flex md:flex-col justify-around md:justify-center gap-4 bg-white/5 rounded-3xl p-6 border border-white/5">
              <div className="text-center md:text-left"><p className="text-2xl font-black text-white leading-none">{userPosts.length}</p><p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-1 font-bold">Total Echoes</p></div>
              <div className="text-center md:text-left"><p className="text-2xl font-black text-cyan-400 leading-none">12.8K</p><p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-1 font-bold">Neural Links</p></div>
            </div>
          </div>
        </motion.div>

        {/* ৩. ফিড ট্যাব */}
        <div className="mt-12">
          <div className="flex items-center gap-8 px-6 mb-8 border-b border-white/5">
            {["Echoes", "Insights", "Media"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] relative ${activeTab === tab ? "text-cyan-400" : "text-gray-600"}`}>
                {tab}
                {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 pb-20">
            <AnimatePresence mode="wait">
              {userPosts.length > 0 ? userPosts.map((post, index) => (
                <motion.div key={post._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <PostCard post={post} onAction={fetchProfileData} />
                </motion.div>
              )) : (
                <div className="py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  <FaRocket className="text-gray-800 text-4xl mx-auto mb-4" />
                  <p className="text-gray-600 italic text-xs uppercase tracking-widest">No neural echoes found in this sector.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] w-full max-w-lg rounded-[3rem] border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between mb-8">
                <h2 className="text-xl font-black italic text-cyan-400 uppercase tracking-tighter">Edit Identity</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white"><FaTimes/></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Display Name</p>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-400 text-white" 
                      value={editData.nickname}
                      onChange={(e) => setEditData({...editData, nickname: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Neural Bio</p>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-400 h-24 text-white resize-none" 
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer p-4 bg-white/5 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${coverFile ? 'border-purple-500' : 'border-white/10 hover:border-cyan-400'}`}>
                    <FaImage className="text-purple-500" />
                    <span className="text-[9px] font-black uppercase">{coverFile ? "Cover Ready" : "Change Cover"}</span>
                    <input type="file" className="hidden" onChange={(e) => setCoverFile(e.target.files[0])} accept="image/*" />
                  </label>
                  
                  <label className={`cursor-pointer p-4 bg-white/5 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${avatarFile ? 'border-cyan-400' : 'border-white/10 hover:border-cyan-400'}`}>
                    <FaCamera className="text-cyan-400" />
                    <span className="text-[9px] font-black uppercase">{avatarFile ? "Avatar Ready" : "Change Avatar"}</span>
                    <input type="file" className="hidden" onChange={(e) => setAvatarFile(e.target.files[0])} accept="image/*" />
                  </label>
                </div>
              </div>

              <button 
                onClick={handleUpdateIdentity}
                disabled={isUpdating}
                className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isUpdating ? "Synchronizing..." : "Update Identity"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {isCreateOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f172a] w-full max-w-lg rounded-[3rem] border border-white/10 p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black italic text-purple-400 uppercase tracking-tighter">New Echo</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-500 hover:text-white"><FaTimes/></button>
              </div>

              <textarea 
                className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-700 text-lg mb-6 resize-none h-32" 
                placeholder="Share your neural drift..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => setFile(e.target.files[0])} 
                accept={postType === 'photo' ? 'image/*' : 'video/*'} 
              />

              <div className="grid grid-cols-3 gap-3 mb-8">
                <button onClick={() => handleFileSelect('photo')} className={`flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border transition-all ${file && postType === 'photo' ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 hover:border-cyan-400'}`}>
                  <FaImage size={24} className="text-cyan-400"/><span className="text-[8px] font-black uppercase">Photo</span>
                </button>
                <button onClick={() => handleFileSelect('video')} className={`flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border transition-all ${file && postType === 'video' ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:border-purple-500'}`}>
                  <FaFilm size={24} className="text-purple-500"/><span className="text-[8px] font-black uppercase">Video</span>
                </button>
                <button onClick={() => handleFileSelect('reel')} className={`flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border transition-all ${file && postType === 'reel' ? 'border-rose-500 bg-rose-500/10' : 'border-white/5 hover:border-rose-500'}`}>
                  <FaPlayCircle size={24} className="text-rose-500"/><span className="text-[8px] font-black uppercase">Reels</span>
                </button>
              </div>

              {file && (
                <div className="mb-6 p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-bold truncate max-w-[200px]">{file.name}</span>
                  <FaCheckCircle className="text-cyan-400" />
                </div>
              )}

              <button onClick={handleTransmit} disabled={isTransmitting} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all disabled:opacity-50">
                {isTransmitting ? "Transmitting..." : "Transmit Echo"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;