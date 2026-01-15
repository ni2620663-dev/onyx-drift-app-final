import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaUserPlus, FaEnvelope, FaPhoneAlt, FaRocket, 
  FaUserCheck, FaSearch, FaArrowLeft, FaGhost 
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const FollowingPage = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId');

  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /**
   * ১. প্রোফাইল ও পোস্ট ফেচিং (Neural Sync)
   */
  const fetchTargetData = useCallback(async (id) => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const encodedId = encodeURIComponent(id);

      const res = await axios.get(`${API_URL}/api/user/profile/${encodedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        setUsers([res.data]); 
      }

      try {
          const postsRes = await axios.get(`${API_URL}/api/posts/user/${encodedId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setPosts(postsRes.data || []);
      } catch (postErr) {
          console.error("Posts sync failed");
      }

      setLoading(false);
    } catch (err) {
      console.error("📡 Neural Link Error:", err.response?.status);
      setLoading(false);
    }
  }, [getAccessTokenSilently, API_URL]);

  /**
   * ২. গ্লোবাল সার্চ ও ডিসকভারি
   */
  const fetchUsers = useCallback(async (query = "", isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const token = await getAccessTokenSilently();
      const currentPage = isInitial ? 1 : page;
      
      const res = await axios.get(`${API_URL}/api/user/search`, {
        params: { query, page: currentPage, limit: 12 },
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(isInitial ? res.data : (prev) => [...prev, ...res.data]);
      setHasMore(res.data.length === 12);
      setLoading(false);
    } catch (err) {
      console.error("Search Error:", err.message);
      setLoading(false);
    }
  }, [getAccessTokenSilently, page, API_URL]);

  useEffect(() => {
    if (targetUserId) {
      setSearchTerm(""); 
      setPosts([]); 
      fetchTargetData(targetUserId);
    } else {
      fetchUsers("", true);
    }
  }, [targetUserId, fetchTargetData, fetchUsers]);

  useEffect(() => {
    if (targetUserId || searchTerm === "") return; 
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchUsers(searchTerm, true);
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, targetUserId, fetchUsers]);

  /**
   * ৩. ফলো সিস্টেম
   */
  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/user/follow/${encodeURIComponent(targetId)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if(res.data.followed) {
        alert("Neural Link Established!");
      } else {
        alert("Neural Link Severed!");
      }
    } catch (err) { 
      console.error("Follow failed", err); 
      alert("Synchronization Error");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-transparent min-h-screen font-sans max-w-7xl mx-auto selection:bg-cyan-500/30">
      
      {/* Header */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => navigate('/feed')} 
            className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Drift
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <FaRocket className="text-cyan-500 animate-bounce" /> NEURAL DISCOVERY
          </h1>
          <p className="text-gray-500 text-[9px] md:text-[10px] mt-2 uppercase tracking-[0.4em] font-bold flex items-center gap-2">
            {targetUserId ? `Identity Locked: ${targetUserId.slice(0, 15)}...` : "Detecting drifters in your sector"}
          </p>
        </div>

        {!targetUserId && (
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search Identity Name or ID..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-xs outline-none focus:border-cyan-500/50 transition-all backdrop-blur-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        )}
      </div>

      {/* Discovery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
        {users.length > 0 ? users.map((u) => (
          <div 
            key={u.auth0Id || u._id} 
            className={`backdrop-blur-2xl border rounded-[2.5rem] p-6 md:p-7 group shadow-2xl relative transition-all duration-500 ${u.auth0Id === targetUserId ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-[#0f172a]/40 border-white/5'}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img 
                  src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-[2.2rem] object-cover border-4 border-white/5 group-hover:border-cyan-500/50 transition-all" 
                  alt={u.name} 
                />
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black p-1.5 rounded-full border-2 border-[#020617]">
                  <FaUserCheck size={10} />
                </div>
              </div>
              <h3 className="text-white font-black text-lg md:text-xl mt-5 italic uppercase truncate w-full">{u.name}</h3>
              <p className="text-cyan-400/40 text-[9px] font-black tracking-widest mt-1 uppercase">{u.nickname || "PERMANENT DRIFTER"}</p>
              
              {/* --- ইউজার আইডি দেখানোর অংশ --- */}
              <p className="mt-2 text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                ID: {u.auth0Id}
              </p>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-3">
                <button onClick={() => handleFollow(u.auth0Id)} className="flex flex-col items-center justify-center p-3 md:p-4 bg-white/5 rounded-3xl border border-white/5 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all group/btn">
                  <FaUserPlus size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black mt-1 uppercase">Link</span>
                </button>
                <button onClick={() => navigate(`/messenger?userId=${encodeURIComponent(u.auth0Id)}`)} className="flex flex-col items-center justify-center p-3 md:p-4 bg-white/5 rounded-3xl border border-white/5 text-purple-500 hover:bg-purple-600 hover:text-white transition-all group/btn">
                  <FaEnvelope size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black mt-1 uppercase">Chat</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 md:p-4 bg-white/5 rounded-3xl border border-white/5 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all group/btn">
                  <FaPhoneAlt size={16} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black mt-1 uppercase">Call</span>
                </button>
            </div>
          </div>
        )) : !loading && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
             <FaGhost className="mx-auto text-gray-700 mb-4 text-3xl" />
             <p className="text-white/20 uppercase font-black tracking-[0.3em] text-[10px]">No Drifter Data Found in this sector</p>
          </div>
        )}
      </div>

      {/* Posts Section */}
      {targetUserId && !loading && (
        <div className="mt-10 md:mt-20 animate-in fade-in slide-in-from-bottom duration-1000">
          <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter mb-8 flex items-center gap-3">
            <div className="w-8 h-[2px] bg-cyan-500" /> NEURAL SIGNALS (POSTS)
          </h2>
          
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {posts.map(post => (
                <div key={post._id} className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-[2rem] backdrop-blur-md hover:border-cyan-500/30 transition-all group shadow-xl">
                  {post.media && (
                    <div className="overflow-hidden rounded-2xl mb-4 border border-white/5">
                       {post.mediaType === 'video' ? (
                         <video src={post.media} className="w-full h-48 object-cover" controls />
                       ) : (
                         <img src={post.media} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" alt="Post" />
                       )}
                    </div>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{post.text || post.content}</p>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    <span className="bg-cyan-500/10 px-3 py-1 rounded-full text-cyan-400">{post.mediaType || 'SIGNAL'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5 backdrop-blur-sm">
               <FaGhost className="mx-auto text-gray-700 mb-4 text-3xl" />
               <p className="text-gray-600 font-black uppercase tracking-[0.4em] text-[10px]">No signals discovered for this drifter</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
            <p className="text-cyan-500 font-black animate-pulse uppercase text-[10px] tracking-[0.5em]">Synchronizing Neural Stream...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowingPage;