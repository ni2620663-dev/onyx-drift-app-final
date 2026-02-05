import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEdit, FaRocket, FaCamera, FaBrain, FaFingerprint, 
  FaHistory, FaTimes, FaPlus, FaCheckCircle, FaBolt,
  FaThLarge, FaPlay, FaAward, FaSearch, FaPlayCircle, 
  FaShoppingCart, FaCrown, FaShieldAlt, FaBoxOpen, FaMicrochip, 
  FaWaveSquare, FaTrophy, FaMedal, FaLeaf, FaGem, FaCompass, FaWind, FaHandsHelping
} from "react-icons/fa";
import { HiBolt } from "react-icons/hi2";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, AreaChart, Area } from "recharts";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";
import NeuralStats from "../components/NeuralStats";
import NeuralForge from "../components/NeuralForge"; // নিশ্চিত করো এই ফাইলটি তোমার components ফোল্ডারে আছে

// --- 🧘 ZenMissionHub Component ---
const ZenMissionHub = () => {
  const missions = [
    {
      id: 1,
      title: "Silent Contributor",
      desc: "Upvote 5 high-value deep thoughts without posting noise.",
      reward: "+15 Trust",
      progress: 60,
      icon: <FaWind className="text-cyan-400" />,
      color: "from-cyan-500/20"
    },
    {
      id: 2,
      title: "Authentic Pulse",
      desc: "Write a thought longer than 100 words with 0% AI detection.",
      reward: "+30 Auth",
      progress: 30,
      icon: <FaLeaf className="text-green-400" />,
      color: "from-green-500/20"
    },
    {
      id: 3,
      title: "Community Anchor",
      desc: "Help a new drifter by answering a query in the nodes.",
      reward: "+50 Impact",
      progress: 90,
      icon: <FaHandsHelping className="text-purple-400" />,
      color: "from-purple-500/20"
    }
  ];

  return (
    <div className="py-2">
      <div className="mb-10">
        <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter flex items-center gap-3">
            <FaCompass className="text-cyan-500" /> Zen Missions
        </h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            Build your legacy through value, not noise.
        </p>
      </div>

      <div className="space-y-6">
        {missions.map((mission) => (
          <motion.div 
            key={mission.id}
            whileHover={{ scale: 1.02 }}
            className={`relative overflow-hidden bg-gradient-to-r ${mission.color} to-transparent border border-white/5 p-6 rounded-[35px] backdrop-blur-xl`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                  {mission.icon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{mission.title}</h3>
                  <p className="text-[10px] text-zinc-400 font-medium max-w-[200px] mt-1 italic leading-tight">
                    {mission.desc}
                  </p>
                </div>
              </div>
              <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{mission.reward}</span>
              </div>
            </div>

            <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${mission.progress}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              />
            </div>
            <div className="flex justify-between mt-2">
                <span className="text-[8px] font-black text-zinc-600 uppercase italic">Status: Syncing...</span>
                <span className="text-[8px] font-black text-zinc-400 uppercase">{mission.progress}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[40px] text-center">
          <FaBolt className="text-yellow-500 mx-auto mb-4 opacity-50" size={24}/>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-loose">
            High-quality interactions increase your <span className="text-white">Neural Resonance</span>. 
          </p>
      </div>
    </div>
  );
};

// --- 🏆 Global Leaderboard Component ---
const GlobalLeaderboard = ({ apiUrl }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/user/leaderboard`);
        setLeaders(res.data);
      } catch (err) {
        console.error("Leaderboard Sync Error");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, [apiUrl]);

  if (loading) return <div className="text-center py-10 animate-pulse text-cyan-500 font-black uppercase tracking-widest">Scanning Global Nodes...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <FaTrophy className="text-yellow-400" size={24} />
        <h2 className="text-xl font-black italic uppercase text-white tracking-tighter">Top Drifters</h2>
      </div>
      
      {leaders.map((leader, index) => (
        <div key={leader._id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${index === 0 ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-black w-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-zinc-400' : 'text-orange-400'}`}>#{index + 1}</span>
            <img src={leader.avatar} className="w-10 h-10 rounded-full border border-white/20 object-cover" alt="leader" />
            <div>
              <p className="text-sm font-black uppercase text-white leading-none">{leader.name || leader.nickname}</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Impact: {leader.neuralImpact}</p>
            </div>
          </div>
          {index < 3 && <FaMedal className={index === 0 ? 'text-yellow-400' : index === 1 ? 'text-zinc-300' : 'text-orange-500'} />}
        </div>
      ))}
    </motion.div>
  );
};

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
  const [activeTab, setActiveTab] = useState("Identity"); 
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [editData, setEditData] = useState({ nickname: '', bio: '' });

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const isOwnProfile = !userId || userId === currentUser?.sub;
  
  const hasNeonAura = userProfile?.profileSettings?.activeAura === 'cyan_glow';
  const hasVerifiedBadge = userProfile?.unlockedAssets?.includes('genesis_badge');

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const targetId = encodeURIComponent(userId || currentUser?.sub);
      
      const res = await axios.get(`${API_URL}/api/user/profile/${targetId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      setUserProfile(res.data.user);
      setEditData({ 
        nickname: res.data.user.nickname || '', 
        bio: res.data.user.bio || '' 
      });
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

  const handleUpdateProfile = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/user/profile/update`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Identity Reshaped! 🧬");
      setIsEditOpen(false);
      fetchProfileData();
    } catch (err) {
      toast.error("Sync Failed");
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

  useEffect(() => { if (isAuthenticated) fetchProfileData(); }, [userId, isAuthenticated]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-400 font-black italic uppercase tracking-widest animate-pulse">
      Initializing Neural Link...
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#020617] text-gray-200 selection:bg-cyan-500/30">
      
      {/* Cover Section */}
      <div className="relative h-60 md:h-80 w-full overflow-hidden">
        <img 
          src={userProfile?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000"} 
          className="w-full h-full object-cover opacity-40 blur-[2px]" 
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20 pb-20">
        
        {/* Profile Header */}
        <div className="relative group p-8 bg-slate-900/40 border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
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

              <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-black p-2 rounded-xl z-20 shadow-xl border-2 border-[#020617]">
                <FaFingerprint size={14} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {userProfile?.name || userProfile?.nickname}
                </h1>
                {hasVerifiedBadge && <FaCheckCircle className="text-cyan-400" size={24} />}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                  <FaBrain className="animate-pulse" /> AI Twin: {userProfile?.aiPersona || "Evolving"}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  {userProfile?.neuralImpact > 1500 ? "Architect" : userProfile?.neuralImpact > 500 ? "Drifter" : "Novice"} 
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <button onClick={() => setIsEditOpen(true)} className="p-5 bg-white/5 border border-white/10 rounded-[2.2rem] hover:bg-white/10 transition-all text-cyan-400">
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

        {/* Tab Selection */}
        <div className="flex gap-8 mb-8 border-b border-white/5 px-2 overflow-x-auto no-scrollbar">
          {[
            { name: "Identity", icon: <FaFingerprint /> },
            { name: "Missions", icon: <FaCompass /> },
            { name: "Echoes", icon: <FaThLarge /> },
            { name: "Reels", icon: <FaPlay /> },
            { name: "Leaderboard", icon: <FaTrophy /> },
            { name: "Assets", icon: <FaBoxOpen /> }
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

        {/* Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {activeTab === "Identity" && (
              <motion.div key="identity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[35px] backdrop-blur-md">
                      <FaShieldAlt className="text-purple-500 mb-4" size={22} />
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trust Score</p>
                      <p className="text-3xl font-black italic text-white mt-1">98.2%</p>
                  </div>
                  <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[35px] backdrop-blur-md">
                      <FaGem className="text-cyan-500 mb-4" size={22} />
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Impact</p>
                      <p className="text-3xl font-black italic text-cyan-400 mt-1">{userProfile?.neuralImpact || 0}</p>
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-white/5 rounded-[40px] p-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 flex items-center gap-3">
                      <FaLeaf className="text-green-500" /> Digital Soul Resonance
                  </h3>
                  <div className="space-y-8">
                      <div>
                          <div className="flex justify-between text-[10px] font-black uppercase mb-3">
                              <span className="text-zinc-500 tracking-widest">Calmness</span>
                              <span className="text-cyan-500">85%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-gradient-to-r from-cyan-600 to-blue-400" />
                          </div>
                      </div>
                      <div>
                          <div className="flex justify-between text-[10px] font-black uppercase mb-3">
                              <span className="text-zinc-500 tracking-widest">Authenticity Depth</span>
                              <span className="text-purple-500">95%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: '95%' }} className="h-full bg-gradient-to-r from-purple-600 to-pink-400" />
                          </div>
                      </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border-l-4 border-cyan-500 p-8 rounded-r-[40px]">
                  <p className="text-lg text-zinc-200 italic">"{userProfile?.bio || "Scanning for signals..."}"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2"><GenesisCard userData={userProfile} /></div>
                   <motion.div onClick={() => setVaultUnlocked(!vaultUnlocked)} className={`p-6 rounded-[2.5rem] border transition-all duration-700 cursor-pointer ${vaultUnlocked ? 'bg-purple-600/10 border-purple-500/40' : 'bg-slate-900/40 border-white/5'}`}>
                      <FaFingerprint size={32} className={vaultUnlocked ? "text-purple-400" : "text-zinc-700"} />
                      <p className="text-[10px] font-black text-white uppercase mt-4 italic">Memory Vault</p>
                   </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "Missions" && (
              <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ZenMissionHub />
              </motion.div>
            )}

            {activeTab === "Echoes" && (
              <motion.div key="echoes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => <PostCard key={post._id} post={post} onAction={fetchProfileData} />)
                ) : (
                  <div className="text-center py-20 text-zinc-700 uppercase italic">Zero Signals Detected</div>
                )}
              </motion.div>
            )}

            {activeTab === "Leaderboard" && <GlobalLeaderboard key="leaderboard" apiUrl={API_URL} />}

            {activeTab === "Reels" && (
              <motion.div key="reels" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userReels.map((reel) => (
                  <div key={reel._id} className="relative aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden group border border-white/5">
                    <video src={reel.media} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "Assets" && (
              <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                
                {/* --- Neural Level Display --- */}
                <div className="p-8 bg-gradient-to-br from-cyan-900/20 to-purple-900/10 border border-white/5 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Current Evolution</p>
                    <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mt-1">
                      {userProfile?.neuralImpact > 1500 ? "Architect" : userProfile?.neuralImpact > 500 ? "Drifter" : "Novice"} 
                      <span className="text-zinc-600 ml-2 text-2xl">LVL {Math.floor((userProfile?.neuralImpact || 0) / 500) + 1}</span>
                    </h2>
                  </div>
                  <div className="w-full md:w-64">
                    <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase mb-2">
                        <span>Progress to Next Rank</span>
                        <span>{userProfile?.neuralImpact % 500} / 500</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(userProfile?.neuralImpact % 500) / 5}%` }}
                          className="h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4]"
                        />
                    </div>
                  </div>
                </div>

                {/* --- The Forge --- */}
                <NeuralForge 
                  userImpact={userProfile?.neuralImpact || 0} 
                  onPurchase={(item) => {
                    toast.success(`${item.name} forged in the nebula!`);
                    fetchProfileData();
                  }} 
                />

                {/* --- Inventory --- */}
                <div className="mt-10">
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 px-4">Your Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userProfile?.unlockedAssets?.map((asset) => (
                      <div key={asset} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <FaBoxOpen className="text-purple-400" />
                          <p className="text-white font-black uppercase text-[10px] tracking-widest">{asset.replace('_', ' ')}</p>
                        </div>
                        <button onClick={() => handleEquipAsset(asset, 'aura')} className="px-5 py-2 rounded-xl text-[9px] font-black uppercase bg-cyan-500 text-black shadow-lg">Equip</button>
                      </div>
                    ))}
                  </div>
                </div>
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
                <input 
                  type="text" 
                  value={editData.nickname}
                  onChange={(e) => setEditData({...editData, nickname: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500 text-white" 
                  placeholder="New Nickname..." 
                />
                <textarea 
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm h-32 outline-none focus:border-cyan-500 text-white" 
                  placeholder="Update Neural Bio..." 
                />
                <button 
                  onClick={handleUpdateProfile}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em]"
                >
                  Synchronize Node
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