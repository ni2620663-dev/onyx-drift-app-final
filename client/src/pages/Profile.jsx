import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEdit, FaRocket, FaCamera, FaBrain, FaFingerprint, 
  FaHistory, FaTimes, FaPlus, FaCheckCircle, FaBolt,
  FaThLarge, FaPlay, FaAward, FaSearch, FaPlayCircle, 
  FaShoppingCart, FaCrown, FaShieldAlt, FaBoxOpen, FaMicrochip, FaWaveSquare
} from "react-icons/fa";
import { HiBolt } from "react-icons/hi2";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";
import NeuralStats from "../components/NeuralStats"; // ✅ imported

// --- 🚀 GenesisCard Component ---
const GenesisCard = ({ userData }) => {
  const navigate = useNavigate();
  const inviteCode = userData?.inviteCode || userData?.nickname?.toLowerCase() || "drifter";
  const fullInviteLink = `onyx-drift.com/join?ref=${inviteCode}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(fullInviteLink);
    toast.success("Neural Link Synced! 🚀");
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="p-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-transparent border border-cyan-500/30 backdrop-blur-3xl relative overflow-hidden group shadow-2xl h-full"
    >
      <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:opacity-30 transition-all duration-700">
          <FaRocket size={100} className="text-cyan-400 -rotate-45" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-black italic text-white tracking-tighter uppercase">Genesis Node</h3>
            <button 
                onClick={() => navigate('/marketplace')}
                className="p-2 bg-white/5 border border-white/10 rounded-xl text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2"
            >
                <FaShoppingCart size={12} />
                <span className="text-[8px] font-black uppercase">Market</span>
            </button>
        </div>

        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 flex justify-between items-center mb-4">
          <span className="text-[10px] font-mono text-cyan-100/60 truncate mr-4">{fullInviteLink}</span>
          <button onClick={copyInvite} className="px-3 py-1 bg-cyan-500 text-black text-[9px] font-black rounded-lg uppercase">Copy</button>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-xl font-black text-white">{userData?.followers?.length || 0}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">Recruits</p>
          </div>
          <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5 text-center cursor-help group/rank" title="Impact Points for Market">
            <p className="text-xl font-black text-cyan-400">{userData?.neuralImpact || 0}</p>
            <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">Impact Pts</p>
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
  const [userReels, setUserReels] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Echoes"); 
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const isOwnProfile = !userId || userId === currentUser?.sub;
  
  const hasNeonAura = userProfile?.profileSettings?.activeAura === 'cyan_glow';
  const hasVerifiedBadge = userProfile?.unlockedAssets?.includes('genesis_badge');

  // মুড গ্রাফ ডাটা প্রসেসিং
  const moodChartData = userProfile?.moodHistory?.slice(-7).map(item => ({
    name: new Date(item.timestamp).toLocaleDateString('en-GB', { weekday: 'short' }),
    intensity: item.intensity
  })) || [];

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const targetId = encodeURIComponent(userId || currentUser?.sub);
      
      const res = await axios.get(`${API_URL}/api/user/profile/${targetId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      setUserProfile(res.data.user);
      const posts = Array.isArray(res.data.posts) ? res.data.posts : [];
      setUserPosts(posts.filter(p => p.postType !== 'reels'));
      setUserReels(posts.filter(p => p.postType === 'reels'));
    } catch (err) {
      console.error("Profile Sync Error:", err);
      toast.error("Neural Link Unstable");
    } finally {
      setLoading(false);
    }
  };

  const handleEquipAsset = async (assetId, type) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/user/equip-asset`, 
        { assetId, type }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Neural Asset Equipped!");
      fetchProfileData();
    } catch (err) {
      toast.error("Sync Failed");
    }
  };
const [editData, setEditData] = useState({ name: '', bio: '' });

const handleUpdateProfile = async () => {
  try {
    const token = await getAccessTokenSilently();
    await axios.put(`${API_URL}/api/user/profile/update`, editData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Identity Reshaped! 🧬");
    setIsEditOpen(false);
    fetchProfileData(); // রিফ্রেশ প্রোফাইল
  } catch (err) {
    toast.error("Sync Failed");
  }
};
  useEffect(() => { if (isAuthenticated) fetchProfileData(); }, [userId, isAuthenticated]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-400 font-black italic uppercase tracking-widest animate-pulse">
      Initializing Neural Link...
    </div>
  );

  return (
    <div className={`w-full min-h-screen bg-[#020617] text-gray-200 selection:bg-cyan-500/30`}>
      
      {/* --- Cover Section --- */}
      <div className="relative h-60 md:h-80 w-full overflow-hidden">
        <img 
          src={userProfile?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000"} 
          className="w-full h-full object-cover opacity-40 blur-[2px]" 
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20 pb-20">
        
        {/* 1️⃣ Header: Digital Identity with Hologram Aura */}
        <div className="relative group p-8 bg-slate-900/40 border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              {/* Neon/Hologram Aura Animation */}
              <div className={`absolute -inset-4 rounded-full blur-2xl z-[-1] transition-opacity duration-1000 ${hasNeonAura ? 'bg-cyan-500/40 opacity-100' : 'bg-cyan-500/10 opacity-50'}`} />
              
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] p-1 bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 ${hasNeonAura ? 'animate-spin-slow' : ''}`}>
                <div className="w-full h-full rounded-[2.4rem] bg-[#020617] p-1 overflow-hidden">
                  <img 
                    src={userProfile?.avatar || currentUser?.picture} 
                    className="w-full h-full rounded-[2.3rem] object-cover filter contrast-125" 
                    alt="Avatar"
                  />
                </div>
              </div>

              {hasVerifiedBadge && (
                <div className="absolute -top-2 -right-2 bg-cyan-500 text-black p-2 rounded-xl z-20 shadow-xl border-2 border-[#020617]">
                  <FaCrown size={14} />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {userProfile?.name || userProfile?.nickname}
                </h1>
                {userProfile?.isVerified && <FaCheckCircle className="text-cyan-400" size={24} />}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                  <FaBrain className="animate-pulse" /> AI Twin: {userProfile?.aiPersona || "Evolving"}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  {userProfile?.drifterLevel || "Novice Drifter"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <button onClick={() => setIsEditOpen(true)} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all text-cyan-400">
                  <FaEdit size={20} />
                </button>
              ) : (
                <button className="px-8 py-4 bg-cyan-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 transition-all">
                  <HiBolt size={18} /> Link Node
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 🚀 New Component: Neural Stats Dashboard */}
        <NeuralStats user={userProfile} />

        {/* 2️⃣ Genesis Card & Neural Resonance (Graph) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
              <GenesisCard userData={userProfile} />
          </div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 p-8 bg-zinc-900/40 border border-white/5 rounded-[3rem] backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 tracking-[0.3em]">
                <FaWaveSquare className="text-cyan-500" /> Neural Resonance
              </h3>
              <div className="flex gap-4 text-[9px] font-bold text-zinc-600 uppercase">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500" /> Pulse</span>
              </div>
            </div>
            
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodChartData}>
                  <XAxis dataKey="name" hide />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#020617', stroke: '#06b6d4', strokeWidth: 2 }} 
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* 3️⃣ Skills / Interests Microcards */}
        <div className="flex flex-wrap gap-3 mb-8">
          {userProfile?.detectedSkills?.map((skill, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(34, 211, 238, 0.1)" }}
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 cursor-pointer transition-colors"
            >
              <FaMicrochip className="text-cyan-400" size={12} />
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">{skill.name}</span>
            </motion.div>
          ))}
          {!userProfile?.detectedSkills?.length && (
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest p-2 italic">Scanning Neural Patterns for Skills...</div>
          )}
        </div>

        {/* 4️⃣ Memory Vault & Impact Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div 
              onClick={() => setVaultUnlocked(!vaultUnlocked)}
              className={`col-span-1 md:col-span-2 p-8 rounded-[3rem] border transition-all duration-700 cursor-pointer overflow-hidden relative ${vaultUnlocked ? 'bg-purple-600/10 border-purple-500/40' : 'bg-slate-900/40 border-white/5'}`}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl transition-all duration-500 ${vaultUnlocked ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-white/5'}`}>
                    <FaFingerprint size={24} className={vaultUnlocked ? "text-white" : "text-zinc-600"} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tighter">Memory Vault</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest italic">
                      {vaultUnlocked ? "Biometric Confirmed - Accessing Legacy" : `${userProfile?.memoryVaultCount || 0} Echoes Archived`}
                    </p>
                  </div>
                </div>
                <FaHistory className={`transition-transform duration-700 ${vaultUnlocked ? 'rotate-180 text-purple-400' : 'text-zinc-700'}`} size={30} />
              </div>
              
              <AnimatePresence>
                {vaultUnlocked && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-6 border-t border-purple-500/20 italic text-[11px] text-purple-200">
                    "The drift never stops. Your signals are your legacy." - Stored 0.2 Cycles Ago
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="p-8 bg-gradient-to-br from-cyan-600/20 to-blue-900/10 border border-cyan-500/20 rounded-[3rem] flex flex-col justify-center text-center shadow-xl">
              <p className="text-5xl font-black text-white italic tracking-tighter">{userProfile?.neuralImpact || 0}</p>
              <p className="text-[10px] text-cyan-500 uppercase font-black tracking-[0.3em] mt-2">Neural Impact</p>
              <div className="flex justify-center gap-2 mt-4">
                <FaBolt className={userProfile?.neuralImpact > 100 ? "text-yellow-400" : "text-zinc-800"} />
                <FaBolt className={userProfile?.neuralImpact > 500 ? "text-yellow-400" : "text-zinc-800"} />
                <FaBolt className={userProfile?.neuralImpact > 1000 ? "text-yellow-400" : "text-zinc-800"} />
              </div>
            </div>
        </div>

        {/* 5️⃣ Tabs & Content */}
        <div className="flex gap-8 mb-8 border-b border-white/5 px-2 overflow-x-auto no-scrollbar">
          {[
            { name: "Echoes", icon: <FaThLarge /> },
            { name: "Reels", icon: <FaPlay /> },
            { name: "Assets", icon: <FaBoxOpen /> },
            { name: "Achievements", icon: <FaAward /> }
          ].map((tab) => (
            <button 
              key={tab.name} 
              onClick={() => setActiveTab(tab.name)} 
              className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${activeTab === tab.name ? "text-cyan-400" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              {tab.icon} {tab.name}
              {activeTab === tab.name && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "Echoes" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => <PostCard key={post._id} post={post} onAction={fetchProfileData} />)
                ) : (
                  <div className="text-center py-20 text-zinc-700 font-black uppercase tracking-[0.3em] italic">Zero Signals Detected</div>
                )}
              </motion.div>
            )}

            {activeTab === "Reels" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userReels.map((reel) => (
                  <div key={reel._id} className="relative aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden group border border-white/5">
                    <video src={reel.media} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white text-[10px] font-black uppercase">
                      <FaPlayCircle className="text-cyan-400" /> {reel.views || 0}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "Assets" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile?.unlockedAssets?.length > 0 ? (
                  userProfile.unlockedAssets.map((asset) => (
                    <div key={asset} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                          {asset.includes('badge') ? <FaCrown /> : <FaShieldAlt />}
                        </div>
                        <div>
                          <p className="text-white font-black uppercase text-[10px] tracking-widest">{asset.replace('_', ' ')}</p>
                          <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Verified System Asset</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleEquipAsset(asset, asset.includes('badge') ? 'badge' : 'aura')}
                        className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                          userProfile?.profileSettings?.activeAura === asset || userProfile?.profileSettings?.activeBadge === asset
                          ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4]'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {userProfile?.profileSettings?.activeAura === asset || userProfile?.profileSettings?.activeBadge === asset ? 'Active' : 'Equip'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-zinc-700 font-black uppercase italic tracking-widest">
                    No Assets Found. Check <span className="text-cyan-500 cursor-pointer" onClick={() => navigate('/marketplace')}>Market</span>.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Identity Edit Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f172a] w-full max-w-md rounded-[3rem] p-10 border border-white/10 shadow-3xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-cyan-400 font-black uppercase italic tracking-tighter text-xl">Reshape Identity</h2>
                <FaTimes className="cursor-pointer text-zinc-500 hover:text-white" onClick={() => setIsEditOpen(false)} />
              </div>
              <div className="space-y-4">
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500 text-white font-mono" placeholder="New Nickname..." />
                <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm h-32 outline-none focus:border-cyan-500 text-white font-mono" placeholder="Update Neural Bio..." />
                <button className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">Synchronize Node</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;