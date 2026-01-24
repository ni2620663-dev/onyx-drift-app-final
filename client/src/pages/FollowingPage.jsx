import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaUserPlus, FaEnvelope, FaPhoneAlt, FaRocket, 
  FaUserCheck, FaSearch, FaArrowLeft
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

// 🧠 DISPLAY NAME HELPER (WORLD-CLASS UX)
const getDisplayName = (u) => {
  if (!u) return "Drifter";
  const name = u.name?.trim() || u.nickname?.trim() || u.displayName?.trim();
  const fallback = u.userId || u.auth0Id || u.sub?.slice(-6) || "Drifter";
  return name && name !== "" ? name : `@${fallback}`;
};

const FollowingPage = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId');

  // Base API URL
  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  /**
   * ১. প্রোফাইল ও পোস্ট লোড করা
   */
  const loadProfileData = useCallback(async (id) => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const encodedId = encodeURIComponent(id);

      const [profileRes, postsRes] = await Promise.all([
        axios.get(`${API_URL}/api/user/profile/${encodedId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/user/posts/user/${encodedId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUsers(profileRes.data ? [profileRes.data] : []);
      setPosts(postsRes.data || []);
    } catch (err) {
      console.error("📡 Neural Link Error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  /**
   * ২. ইউজার সার্চ (Endpoint fixed: /api/user/search)
   */
  const loadDiscoveryList = useCallback(async (query = "") => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      // ✅ FIXED: Changed /api/users/search to /api/user/search
      const res = await axios.get(`${API_URL}/api/user/search`, {
        params: { q: query, limit: 20 },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(res.data || []);
      setPosts([]); 
    } catch (err) {
      console.error("🔍 Search Error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (targetUserId) {
      loadProfileData(targetUserId);
    } else {
      const delayDebounceFn = setTimeout(() => {
        loadDiscoveryList(searchTerm);
      }, 500); 
      return () => clearTimeout(delayDebounceFn);
    }
  }, [targetUserId, searchTerm, loadProfileData, loadDiscoveryList]);

  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/user/follow/${encodeURIComponent(targetId)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.msg || "Identity Linked!");
    } catch (err) { 
      alert("Synchronization Error");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-transparent min-h-screen font-sans max-w-7xl mx-auto selection:bg-cyan-500/30">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => targetUserId ? navigate('/following') : navigate('/feed')} 
            className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
            {targetUserId ? "Back to Discovery" : "Back to Feed"}
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <FaRocket className="text-cyan-500" /> 
            {targetUserId ? "DRIFTER PROFILE" : "IDENTITY SCANNER"}
          </h1>
        </div>

        {!targetUserId && (
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search Name or ID..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-xs outline-none focus:border-cyan-500/50 transition-all backdrop-blur-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" />
          </div>
        )}
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-1 ${targetUserId ? 'max-w-md mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6`}>
        {users.length > 0 ? users.map((u) => (
          <div 
            key={u.auth0Id || u.userId || u._id} 
            className={`backdrop-blur-2xl border rounded-[2.5rem] p-6 shadow-2xl transition-all duration-500 ${targetUserId ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-[#0f172a]/40 border-white/5 hover:-translate-y-2'}`}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="relative cursor-pointer" 
                onClick={() => navigate(`/following?userId=${encodeURIComponent(u.auth0Id || u.userId)}`)}
              >
                <img 
                  src={u.avatar || u.picture || `https://ui-avatars.com/api/?background=0d1117&color=00f2ff&bold=true&name=${encodeURIComponent(getDisplayName(u))}`} 
                  className="w-24 h-24 rounded-[2.2rem] object-cover border-4 border-white/5 shadow-inner" 
                  alt="Avatar" 
                  onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Drifter"; }}
                />
                {u.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black p-1.5 rounded-full ring-4 ring-[#0f172a]">
                    <FaUserCheck size={10} />
                  </div>
                )}
              </div>
              <h3 className="text-white font-black text-xl mt-4 italic uppercase leading-none">
                {getDisplayName(u)}
              </h3>
              <p className="text-cyan-400/40 text-[9px] font-black tracking-widest uppercase mt-2">
                @{u.userId || u.nickname || "drifter"}
              </p>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-3">
                <button onClick={() => handleFollow(u.auth0Id || u.userId)} className="flex flex-col items-center p-3 bg-white/5 rounded-2xl text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all group">
                  <FaUserPlus size={16} />
                  <span className="text-[7px] font-black mt-1 uppercase">Follow</span>
                </button>
                <button onClick={() => navigate(`/messenger?userId=${u.auth0Id || u.userId}`)} className="flex flex-col items-center p-3 bg-white/5 rounded-2xl text-purple-500 hover:bg-purple-600 hover:text-white transition-all">
                  <FaEnvelope size={16} />
                  <span className="text-[7px] font-black mt-1 uppercase">Chat</span>
                </button>
                <button onClick={() => navigate(`/call/${u.auth0Id || u.userId}`)} className="flex flex-col items-center p-3 bg-white/5 rounded-2xl text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">
                  <FaPhoneAlt size={16} />
                  <span className="text-[7px] font-black mt-1 uppercase">Call</span>
                </button>
            </div>
          </div>
        )) : !loading && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-500 font-black italic uppercase tracking-[0.3em] text-xs">No Drifter Signal Found</p>
          </div>
        )}
      </div>

      {/* Target User Posts */}
      {targetUserId && !loading && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-white font-black italic mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" /> RECENT SIGNALS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.length > 0 ? posts.map(post => (
              <div key={post._id} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] hover:border-cyan-500/30 transition-all group">
                {post.media && (
                  <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-black/40 border border-white/5">
                    {post.mediaType === 'video' ? (
                      <video src={post.media} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={post.media} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Post" />
                    )}
                  </div>
                )}
                <p className="text-gray-300 text-sm leading-relaxed">{post.text || post.content}</p>
              </div>
            )) : <p className="text-gray-600 text-xs italic tracking-widest">NO SIGNALS TRANSMITTED IN THIS SECTOR...</p>}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[100]">
          <div className="w-10 h-10 border-4 border-t-cyan-500 border-cyan-500/20 rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
        </div>
      )}
    </div>
  );
};

export default FollowingPage;