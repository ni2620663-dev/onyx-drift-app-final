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
   * ১. নির্দিষ্ট ইউজারের প্রোফাইল ও পোস্ট নিয়ে আসা
   */
  const fetchTargetData = useCallback(async (id) => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      const encodedId = encodeURIComponent(id);

      // প্রোফাইল ডাটা ফেচ
      const res = await axios.get(`${API_URL}/api/user/profile/${encodedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        setUsers([res.data]); // শুধুমাত্র ওই ইউজারকে লিস্টে রাখা
      }

      // ওই ইউজারের সব পোস্ট (Reels/Videos সহ) ফেচ
      const postsRes = await axios.get(`${API_URL}/api/user/posts/user/${encodedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(postsRes.data || []);

    } catch (err) {
      console.error("📡 Neural Link Error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, API_URL]);

  /**
   * ২. গ্লোবাল সার্চ লজিক (ফেসবুক স্টাইল)
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
    } catch (err) {
      console.error("Search Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, page, API_URL]);

  // কন্ট্রোলার: URL-এ userId থাকলে সেটা দেখাবে, না থাকলে সার্চ লিস্ট দেখাবে
  useEffect(() => {
    if (targetUserId) {
      fetchTargetData(targetUserId);
    } else {
      fetchUsers(searchTerm, true);
    }
  }, [targetUserId, searchTerm, fetchTargetData, fetchUsers]);

  /**
   * ৩. ফলো সিস্টেম
   */
  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/user/follow/${encodeURIComponent(targetId)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.msg);
      // স্টেট আপডেট করার জন্য পুনরায় ফেচ করা যেতে পারে
    } catch (err) { 
      alert("Synchronization Error");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-transparent min-h-screen font-sans max-w-7xl mx-auto selection:bg-cyan-500/30">
      
      {/* Header */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => targetUserId ? navigate('/following') : navigate('/feed')} 
            className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
            {targetUserId ? "Back to Discovery" : "Back to Drift"}
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <FaRocket className="text-cyan-500 animate-bounce" /> 
            {targetUserId ? "USER PROFILE" : "SEARCH DRIFTERS"}
          </h1>
        </div>

        {/* Search Bar */}
        {!targetUserId && (
          <div className="relative w-full md:w-96 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Name, Nickname or ID..." 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-xs outline-none focus:border-cyan-500/50 transition-all backdrop-blur-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" />
            </div>
          </div>
        )}
      </div>

      {/* Discovery / Profile Grid */}
      <div className={`grid grid-cols-1 ${targetUserId ? 'sm:grid-cols-1 max-w-md mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6 md:gap-8 mb-16`}>
        {users.map((u) => (
          <div 
            key={u.auth0Id} 
            className={`backdrop-blur-2xl border rounded-[2.5rem] p-6 md:p-7 group shadow-2xl relative transition-all duration-500 ${u.auth0Id === targetUserId ? 'bg-cyan-500/10 border-cyan-500/40 ring-2 ring-cyan-500/20' : 'bg-[#0f172a]/40 border-white/5 hover:border-white/20 hover:-translate-y-2'}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative cursor-pointer" onClick={() => navigate(`/following?userId=${u.auth0Id}`)}>
                <img 
                  src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-[2.2rem] object-cover border-4 border-white/5 group-hover:border-cyan-500/50 transition-all" 
                  alt={u.name} 
                />
                {u.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black p-1.5 rounded-full border-2 border-[#020617]">
                    <FaUserCheck size={10} />
                  </div>
                )}
              </div>
              <h3 className="text-white font-black text-lg md:text-xl mt-5 italic uppercase tracking-tighter">{u.name}</h3>
              <p className="text-cyan-400/40 text-[9px] font-black tracking-widest mt-1 uppercase">@{u.nickname || "drifter"}</p>
              <p className="text-gray-400 text-[10px] mt-3 line-clamp-2 px-4">{u.bio || "No bio signal detected..."}</p>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-3">
                <button onClick={() => handleFollow(u.auth0Id)} className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/5 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all">
                  <FaUserPlus size={16} />
                  <span className="text-[7px] font-black mt-1 uppercase">Link</span>
                </button>
                <button onClick={() => navigate(`/messenger?userId=${u.auth0Id}`)} className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/5 text-purple-500 hover:bg-purple-600 hover:text-white transition-all">
                  <FaEnvelope size={16} />
                  <span className="text-[7px] font-black mt-1 uppercase">Chat</span>
                </button>
                <button onClick={() => navigate(`/call/${u.auth0Id}`)} className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/5 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all">
                  <FaPhoneAlt size={16} />
                  <span className="text-[7px] font-black mt-1 uppercase">Call</span>
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Target User Posts Section */}
      {targetUserId && !loading && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom duration-700">
          <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-cyan-500"></span> RECENT SIGNALS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.length > 0 ? posts.map(post => (
              <div key={post._id} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] backdrop-blur-md">
                {post.media && (
                  <div className="rounded-2xl overflow-hidden mb-4 border border-white/5 aspect-video bg-black/20">
                    {post.mediaType === 'video' ? (
                      <video src={post.media} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={post.media} className="w-full h-full object-cover" alt="Post" />
                    )}
                  </div>
                )}
                <p className="text-gray-300 text-sm font-medium">{post.text || post.content}</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="text-cyan-500/40">Encrypted Data</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">No Signals Found from this Drifter</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md z-[100]">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default FollowingPage;