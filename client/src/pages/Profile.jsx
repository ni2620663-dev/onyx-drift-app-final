import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEdit, FaCalendarAlt, FaMapMarkerAlt, FaShieldAlt, 
  FaRocket, FaCamera, FaImage, FaFilm, FaPlayCircle, FaTimes, FaPlus, FaCheckCircle, FaGhost, FaUserPlus, FaEnvelope, FaSearch
} from "react-icons/fa";
import { BRAND_NAME } from "../utils/constants";
import PostCard from "../components/PostCard";

const Profile = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  const { user: currentUser, getAccessTokenSilently } = useAuth0();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Echoes");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  
  const isGhostMode = userProfile?.isGhostMode || false;
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("image"); 
  const [isTransmitting, setIsTransmitting] = useState(false);

  // API URL logic
  const API_URL = import.meta.env.VITE_API_URL || "https://onyx-drift-api-server.onrender.com";
  const fileInputRef = useRef(null);

  const [editData, setEditData] = useState({ nickname: "", bio: "", location: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditData({
        nickname: userProfile.name || userProfile.nickname || "",
        bio: userProfile.bio || "",
        location: userProfile.location || ""
      });
    }
  }, [userProfile]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to terminate this neural echo?")) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${API_URL}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to terminate signal.");
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const rawId = userId || currentUser?.sub;
      
      // গুরুত্বপূর্ণ: আইডিটি এনকোড করা হয়েছে যাতে ব্যাকএন্ড ৪-০-৪ না দেয়
      const targetId = encodeURIComponent(rawId); 
      
      const [profileRes, postsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/user/profile/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/posts/user/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/user/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUserProfile(profileRes.data);
      setUserPosts(postsRes.data);
      setSuggestedUsers(usersRes.data.slice(0, 5));

    } catch (err) {
      console.error("Neural Fetch Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser || userId) fetchProfileData();
  }, [userId, currentUser]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(`${API_URL}/api/user/search?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
      } catch (err) { console.log(err); }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    setIsProcessingFriend(true);
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/user/friend-request/${targetUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Request Sent!");
      if(targetUserId === userId) setIsFriendRequestSent(true);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed");
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleUpdateIdentity = async () => {
    // ভ্যালিডেশন চেক: নাম অবশ্যই থাকতে হবে
    if (!editData.nickname.trim()) return alert("Nickname/Name is required for synchronization.");
    
    setIsUpdating(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      
      // ব্যাকএন্ডে 'name' এবং 'nickname' উভয়ই পাঠানো হচ্ছে সেফটি হিসেবে
      formData.append("name", editData.nickname); 
      formData.append("nickname", editData.nickname);
      formData.append("bio", editData.bio);
      formData.append("location", editData.location);
      if (currentUser?.email) formData.append("email", currentUser.email); 
      
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
      console.error("Update Fail:", err.response?.data || err.message);
      alert("Sync Failed: " + (err.response?.data?.msg || "Neural interferences."));
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
      formData.append("mediaType", postType === 'photo' ? 'image' : postType); 
      if (file) formData.append("media", file);
      
      // পোস্ট তৈরির সময় ইউজারের নাম পাঠানো হচ্ছে যাতে ৫-০-০ এরর না আসে
      formData.append("authorName", userProfile?.name || userProfile?.nickname || "Drifter");
      formData.append("authorAvatar", userProfile?.avatar || "");

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
      console.error("Transmission Error:", err.response?.data || err.message);
      alert("Transmission Interrupted.");
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleFileSelect = (type) => {
    const backendType = type === 'photo' ? 'image' : type;
    setPostType(backendType);
    setTimeout(() => {
      fileInputRef.current.click();
    }, 100);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-400 font-black italic uppercase tracking-[0.3em] text-center px-6">
      SYNCING NEURAL IDENTITY...
    </div>
  );

  const isOwnProfile = !userId || userId === currentUser?.sub;

  return (
    <div className={`w-full min-h-screen transition-all duration-700 ${isGhostMode ? 'bg-black' : 'bg-[#020617]'} text-gray-200 overflow-x-hidden flex flex-col`}>
      
      {/* Search Bar */}
      <div className="w-full py-4 px-6 border-b border-white/5 sticky top-0 z-[60] bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center relative">
          <div className="relative w-full max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Search neural drifters..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm outline-none focus:border-cyan-400 transition-all"
              value={searchQuery}
              onChange={handleSearch}
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-2 max-h-80 overflow-y-auto">
                  {searchResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer" onClick={() => {navigate(`/profile/${u.auth0Id || u._id}`); setSearchResults([]);}}>
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} className="w-8 h-8 rounded-full border border-cyan-400/30" alt="" />
                        <span className="text-xs font-bold">{u.name || u.nickname}</span>
                      </div>
                      <FaUserPlus className="text-cyan-400" onClick={(e) => {e.stopPropagation(); handleAddFriend(u.auth0Id || u._id);}} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-row max-w-[1400px] mx-auto w-full">
        <aside className="hidden lg:block w-72 p-6 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto border-r border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Neural Connects</h3>
          <div className="space-y-6">
            {suggestedUsers.map((u) => (
              <div key={u._id} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer" onClick={() => navigate(`/profile/${u.auth0Id || u._id}`)}>
                <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-white truncate">{u.name || u.nickname}</p>
                  <p className="text-[9px] text-gray-600 uppercase">Verified Member</p>
                </div>
                <button onClick={(e) => {e.stopPropagation(); handleAddFriend(u.auth0Id || u._id);}} className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500 hover:text-white">
                  <FaPlus size={10} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 pb-20">
          <div className="relative h-48 md:h-72 w-full overflow-hidden">
            <img 
              src={userProfile?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000"} 
              className={`w-full h-full object-cover transition-all duration-1000 ${isGhostMode ? 'opacity-20 grayscale blur-sm' : 'opacity-40'}`}
              alt="Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent"></div>
            {isOwnProfile && (
              <button onClick={() => setIsEditOpen(true)} className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:border-cyan-400 text-white transition-all">
                <FaCamera size={18} />
              </button>
            )}
          </div>

          <div className="max-w-[900px] mx-auto px-4 -mt-16 md:-mt-24 relative z-20">
            <motion.div 
              animate={{ boxShadow: isGhostMode ? "0 0 40px rgba(255,255,255,0.05)" : "none" }}
              className={`bg-white/5 backdrop-blur-2xl border transition-all duration-700 ${isGhostMode ? 'border-white/20' : 'border-white/10'} rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 shadow-2xl`}
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                  <div className="relative group">
                    <img 
                      src={userProfile?.avatar || currentUser?.picture} 
                      className={`w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[2.5rem] border-4 border-[#020617] shadow-lg object-cover bg-[#0f172a] transition-all duration-700 ${isGhostMode ? 'grayscale invert brightness-125' : ''}`} 
                      alt="Avatar"
                    />
                    {!isGhostMode && userProfile?.isPremium && (
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-cyan-400 to-purple-600 p-2 md:p-2.5 rounded-xl md:rounded-2xl border-4 border-[#020617] shadow-lg">
                        <FaShieldAlt className="text-white text-xs" />
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                      {isGhostMode ? "STAY_HIDDEN" : (userProfile?.name || userProfile?.nickname || currentUser?.nickname)}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all duration-500 ${isGhostMode ? 'bg-white text-black border-white' : 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400'}`}>
                        {isGhostMode ? "GHOST" : `${BRAND_NAME} PRO`}
                      </span>
                      {!isGhostMode && <p className="text-gray-500 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em]">Verified Drifter</p>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                  {isOwnProfile ? (
                    <>
                      <button onClick={() => setIsEditOpen(true)} className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                        <FaEdit /> Edit
                      </button>
                      <button onClick={() => setIsCreateOpen(true)} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center justify-center gap-2 transition-all ${isGhostMode ? 'bg-white text-black' : 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-cyan-500/20'}`}>
                        <FaPlus /> Echo
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleAddFriend(userId)}
                        disabled={isFriendRequestSent || isProcessingFriend}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                          isFriendRequestSent 
                          ? "bg-gray-800 border border-white/10 text-gray-400 cursor-not-allowed" 
                          : "bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/30 shadow-cyan-500/20 active:scale-95"
                        }`}
                      >
                        {isProcessingFriend ? "Syncing..." : isFriendRequestSent ? <><FaCheckCircle /> Sent</> : <><FaUserPlus /> Add Friend</>}
                      </button>
                      <button onClick={() => navigate('/messenger')} className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2">
                        <FaEnvelope /> Message
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-8 border-t border-white/5">
                <div className="col-span-2">
                  <h3 className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-center md:text-left transition-colors ${isGhostMode ? 'text-white' : 'text-cyan-400'}`}>Neural Signature</h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed italic text-center md:text-left">
                    "{isGhostMode ? "Transmission encrypted. Identity masked by ghost protocol." : (userProfile?.bio || "Scanning the drift for meaning...")}"
                  </p>
                </div>
                <div className="flex flex-row md:flex-col justify-around md:justify-center gap-4 bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/5">
                  <div className="text-center md:text-left">
                    <p className="text-xl md:text-2xl font-black text-white leading-none">{isGhostMode ? "??" : userPosts.length}</p>
                    <p className="text-[7px] md:text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-1 font-bold">Total Echoes</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className={`text-xl md:text-2xl font-black leading-none ${isGhostMode ? 'text-white' : 'text-cyan-400'}`}>{isGhostMode ? "HIDDEN" : "12.8K"}</p>
                    <p className="text-[7px] md:text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-1 font-bold">Neural Links</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="mt-12">
              <div className="flex items-center justify-center md:justify-start gap-6 md:gap-8 px-2 md:px-6 mb-8 border-b border-white/5">
                {["Echoes", "Insights", "Media"].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] relative ${activeTab === tab ? (isGhostMode ? "text-white" : "text-cyan-400") : "text-gray-600"}`}>
                    {tab}
                    {activeTab === tab && <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-0.5 ${isGhostMode ? 'bg-white shadow-[0_0_10px_#fff]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`} />}
                  </button>
                ))}
              </div>
              
              <div className={`grid grid-cols-1 gap-6 pb-20 transition-all duration-700 ${isGhostMode ? 'blur-md grayscale opacity-30 select-none pointer-events-none' : ''}`}>
                <AnimatePresence mode="wait">
                  {userPosts.length > 0 ? userPosts.map((post, index) => (
                    <motion.div key={post._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <PostCard 
                        post={post} 
                        onAction={fetchProfileData} 
                        onDelete={() => handleDeletePost(post._id)} 
                      />
                    </motion.div>
                  )) : (
                    <div className="py-20 text-center bg-white/5 rounded-[2rem] md:rounded-[3rem] border border-dashed border-white/10 mx-2">
                      <FaRocket className="text-gray-800 text-3xl md:text-4xl mx-auto mb-4" />
                      <p className="text-gray-600 italic text-[10px] md:text-xs uppercase tracking-widest">No neural echoes found in this sector.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg md:text-xl font-black italic text-cyan-400 uppercase tracking-tighter">Edit Identity</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white p-2"><FaTimes size={20}/></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-500 uppercase ml-2">Display Name</p>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 text-white" value={editData.nickname} onChange={(e) => setEditData({...editData, nickname: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-500 uppercase ml-2">Neural Bio</p>
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-4 h-24 text-white resize-none" value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <label className={`cursor-pointer p-4 bg-white/5 border rounded-2xl flex flex-col items-center justify-center gap-2 ${coverFile ? 'border-purple-500' : 'border-white/10'}`}>
                    <FaImage className="text-purple-500 text-xl" />
                    <span className="text-[8px] font-black uppercase">{coverFile ? "Ready" : "Cover"}</span>
                    <input type="file" className="hidden" onChange={(e) => setCoverFile(e.target.files[0])} accept="image/*" />
                  </label>
                  <label className={`cursor-pointer p-4 bg-white/5 border rounded-2xl flex flex-col items-center justify-center gap-2 ${avatarFile ? 'border-cyan-400' : 'border-white/10'}`}>
                    <FaCamera className="text-cyan-400 text-xl" />
                    <span className="text-[8px] font-black uppercase">{avatarFile ? "Ready" : "Avatar"}</span>
                    <input type="file" className="hidden" onChange={(e) => setAvatarFile(e.target.files[0])} accept="image/*" />
                  </label>
                </div>
              </div>
              <button onClick={handleUpdateIdentity} disabled={isUpdating} className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] disabled:opacity-50">
                {isUpdating ? "Synchronizing..." : "Update Identity"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {isCreateOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-6 md:p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg md:text-xl font-black italic text-purple-400 uppercase tracking-tighter">New Echo</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-500 hover:text-white p-2"><FaTimes size={20}/></button>
              </div>
              <textarea className="w-full bg-transparent border-none outline-none text-white text-base mb-6 resize-none h-32" placeholder="Share your neural drift..." value={content} onChange={(e) => setContent(e.target.value)} />
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} accept={postType === 'image' ? 'image/*' : 'video/*'} />
              <div className="grid grid-cols-3 gap-2 mb-8">
                <button onClick={() => handleFileSelect('photo')} className={`flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border ${postType === 'image' && file ? 'border-cyan-400' : 'border-white/5'}`}>
                  <FaImage size={20} className="text-cyan-400"/><span className="text-[7px] font-black uppercase">Photo</span>
                </button>
                <button onClick={() => handleFileSelect('video')} className={`flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border ${postType === 'video' && file ? 'border-purple-500' : 'border-white/5'}`}>
                  <FaFilm size={20} className="text-purple-500"/><span className="text-[7px] font-black uppercase">Video</span>
                </button>
                <button onClick={() => handleFileSelect('reel')} className={`flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border ${postType === 'reel' && file ? 'border-rose-500' : 'border-white/5'}`}>
                  <FaPlayCircle size={20} className="text-rose-500"/><span className="text-[7px] font-black uppercase">Reels</span>
                </button>
              </div>
              {file && (
                <div className="mb-6 p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-xl flex items-center justify-between">
                  <span className="text-[9px] text-cyan-400 font-bold truncate">{file.name}</span>
                  <FaCheckCircle className="text-cyan-400" />
                </div>
              )}
              <button onClick={handleTransmit} disabled={isTransmitting} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-[0.3em] disabled:opacity-50">
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