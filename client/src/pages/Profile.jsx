import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEdit, FaShieldAlt, FaRocket, FaCamera, FaImage, 
  FaFilm, FaPlayCircle, FaTimes, FaPlus, FaCheckCircle, 
  FaUserPlus, FaEnvelope, FaSearch, FaMagic, FaAward
} from "react-icons/fa";
import { BRAND_NAME } from "../utils/constants";
import PostCard from "../components/PostCard";

const GenesisCard = ({ userData }) => {
  const inviteCode = userData?.inviteCode || userData?.nickname?.toLowerCase() || "drifter";
  const fullInviteLink = `onyx-drift.com/join?ref=${inviteCode}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(fullInviteLink);
    alert("Neural Link Synced to Clipboard! 🚀");
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="mb-8 p-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-transparent border border-cyan-500/30 backdrop-blur-3xl relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:opacity-30 group-hover:-translate-y-2 group-hover:translate-x-2 transition-all duration-700">
         <FaRocket size={120} className="text-cyan-400 -rotate-45" />
      </div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-black italic text-white tracking-tighter uppercase">Genesis Node</h3>
          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            Propagation Active
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xl group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500">
          <FaMagic className="text-sm" />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="bg-black/60 p-4 rounded-2xl border border-white/10 group-hover:border-cyan-500/50 transition-colors">
          <p className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-widest">Personal Recruitment Link</p>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[11px] font-mono text-cyan-100 italic truncate opacity-80">
              {fullInviteLink}
            </span>
            <button 
              onClick={copyInvite} 
              className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-lg text-[10px] font-black transition-all uppercase tracking-tighter border border-cyan-500/50"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
           <div className="flex-1 text-center p-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <p className="text-xl font-black text-white">{userData?.inviteCount || 0}</p>
              <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mt-1">Recruits</p>
           </div>
           <div className="flex-1 text-center p-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
              <p className="text-xl font-black text-cyan-400 uppercase tracking-tighter">{userData?.neuralRank || "Neophyte"}</p>
              <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mt-1">Neural Rank</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const Profile = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  const { user: currentUser, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Echoes");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("image"); 
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [editData, setEditData] = useState({ nickname: "", bio: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const fileInputRef = useRef(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const rawId = userId || currentUser?.sub;
      if (!rawId) return;
      
      const targetId = encodeURIComponent(rawId); 

      // 🔥 গুরুত্বপূর্ণ: এখানে /api/user/profile থেকে /api/profile এ পরিবর্তন করা হয়েছে আপনার সার্ভার পাথ অনুযায়ী
      const [profileRes, postsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/profile/${targetId}`, {
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
      console.error("📡 Neural Link Error:", err.response?.status || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchProfileData();
  }, [userId, isAuthenticated, currentUser?.sub]);

  useEffect(() => {
    if (userProfile) {
      setEditData({
        nickname: userProfile.name || userProfile.nickname || "",
        bio: userProfile.bio || ""
      });
    }
  }, [userProfile]);

  const handleUpdateIdentity = async () => {
    if (!editData.nickname.trim()) return alert("Nickname required");
    setIsUpdating(true);
    try {
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/user/update-profile`, {
        name: editData.nickname,
        bio: editData.bio
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditOpen(false);
      fetchProfileData(); 
    } catch (err) { alert("Identity Sync Failed"); }
    finally { setIsUpdating(false); }
  };

  const handleTransmit = async () => {
    if (!content.trim()) return alert("Transmission empty");
    setIsTransmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts`, {
        text: content,
        mediaType: "text", // আপাতত টেক্সট পোস্ট হিসেবে
        authorName: userProfile?.name || "Drifter",
        authorAvatar: userProfile?.avatar || ""
      }, { headers: { Authorization: `Bearer ${token}` } });
      setUserPosts([res.data, ...userPosts]); 
      setIsCreateOpen(false);
      setContent("");
    } catch (err) { alert("Transmission Interrupted"); }
    finally { setIsTransmitting(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-black italic uppercase tracking-[0.3em] text-[10px]">Syncing Neural Identity...</p>
      </div>
    </div>
  );

  const isOwnProfile = !userId || userId === currentUser?.sub;

  return (
    <div className="w-full min-h-screen bg-[#020617] text-gray-200 overflow-x-hidden flex flex-col">
      
      {/* Search Header */}
      <div className="w-full py-4 px-6 border-b border-white/5 sticky top-0 z-[60] bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center relative">
          <div className="relative w-full max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Search neural drifters..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-row max-w-[1400px] mx-auto w-full flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 p-6 sticky top-20 h-[calc(100vh-80px)] border-r border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Neural Connects</h3>
          <div className="space-y-6">
            {suggestedUsers.map((u) => (
              <div key={u._id} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/profile/${encodeURIComponent(u.auth0Id)}`)}>
                <img 
                  src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} 
                  className="w-10 h-10 rounded-xl object-cover" 
                  referrerPolicy="no-referrer"
                  alt="" 
                />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-white truncate">{u.name || u.nickname}</p>
                  <p className="text-[9px] text-gray-600 uppercase">Verified Member</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Profile Feed */}
        <main className="flex-1 pb-20">
          <div className="relative h-48 md:h-72 w-full overflow-hidden">
            <img 
              src={userProfile?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000"} 
              className="w-full h-full object-cover opacity-40"
              alt="Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
          </div>

          <div className="max-w-[900px] mx-auto px-4 -mt-16 md:-mt-24 relative z-20">
            {isOwnProfile && <GenesisCard userData={userProfile} />}

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 shadow-2xl mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                  <div className="relative">
                    <img 
                      src={userProfile?.avatar || currentUser?.picture} 
                      className="w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[2.5rem] border-4 border-[#020617] shadow-lg object-cover bg-[#0f172a]" 
                      referrerPolicy="no-referrer"
                      alt="Avatar"
                    />
                    {userProfile?.isVerified && (
                       <div className="absolute -bottom-2 -right-2 bg-cyan-500 p-2 rounded-xl border-4 border-[#020617]">
                         <FaCheckCircle className="text-white text-xs" />
                       </div>
                    )}
                  </div>
                  
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase">
                      {userProfile?.name || userProfile?.nickname || "DRIFTER"}
                    </h1>
                    <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mt-1">
                      {userProfile?.neuralRank || "Level 1 Node"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {isOwnProfile ? (
                    <button onClick={() => setIsEditOpen(true)} className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                      <FaEdit /> Edit
                    </button>
                  ) : (
                    <button className="px-8 py-3 rounded-2xl bg-cyan-600 text-[10px] font-black uppercase tracking-widest">
                      <FaUserPlus /> Connect
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-cyan-400">Neural Signature</h3>
                  <p className="text-gray-400 text-sm italic italic leading-relaxed">
                    "{userProfile?.bio || "No signal signature detected..."}"
                  </p>
                </div>
                
                <div className="flex gap-10 bg-white/5 rounded-3xl p-6 border border-white/5">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{userPosts.length}</p>
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Echoes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-cyan-400">{userProfile?.followers?.length || 0}</p>
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Links</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Echoes List */}
            <div className="space-y-6 pb-20">
              <div className="flex gap-8 px-2 border-b border-white/5 mb-8">
                <button className="pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 border-b-2 border-cyan-400">Echoes</button>
                <button className="pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Media</button>
              </div>

              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onAction={fetchProfileData} 
                    onDelete={fetchProfileData} 
                  />
                ))
              ) : (
                <div className="text-center py-20 opacity-30 text-xs uppercase tracking-widest italic">Zero neural signals detected</div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-cyan-400 font-black uppercase italic">Edit Identity</h2>
                <button onClick={() => setIsEditOpen(false)}><FaTimes /></button>
              </div>
              <div className="space-y-4">
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-400"
                  placeholder="Nickname"
                  value={editData.nickname}
                  onChange={(e) => setEditData({...editData, nickname: e.target.value})}
                />
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-32 text-white text-sm outline-none focus:border-cyan-400"
                  placeholder="Neural Bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                />
                <button 
                  onClick={handleUpdateIdentity}
                  disabled={isUpdating}
                  className="w-full py-4 bg-cyan-500 rounded-xl font-black uppercase text-[10px] tracking-widest text-black"
                >
                  {isUpdating ? "Syncing..." : "Update"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;