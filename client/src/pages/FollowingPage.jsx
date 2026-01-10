import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaUserPlus, FaEnvelope, FaPhoneAlt, FaRocket, 
  FaUserCheck, FaSearch, FaArrowLeft 
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const FollowingPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const { getAccessTokenSilently, user: auth0User } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId');

  // আপনার API URL
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /**
   * ইউজার লিস্ট ফেচ করা
   * নোট: কনসোলের "Cannot GET /api/user/all" এরর ফিক্স করতে এখানে /search ব্যবহার করা হয়েছে
   */
  const fetchUsers = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      // আপনার ব্যাকএন্ডে /all নেই, তাই /search রাউট কল করা হচ্ছে
      const res = await axios.get(`${API_URL}/api/user/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(res.data);
      setLoading(false);

      if (targetUserId) {
        setSearchTerm(targetUserId); 
      }
    } catch (err) {
      console.error("Neural Fetch Error:", err.response?.data || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [getAccessTokenSilently, targetUserId]);

  /**
   * ফলো/আনফলো সিস্টেম
   * আইডি-তে থাকা পাইপ (|) ক্যারেক্টার হ্যান্ডেল করার জন্য encodeURIComponent ব্যবহার করা হয়েছে
   */
  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      const encodedId = encodeURIComponent(targetId);
      
      const res = await axios.post(`${API_URL}/api/user/follow/${encodedId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // রিয়েল-টাইম UI আপডেট
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.auth0Id === targetId) {
            const isNowFollowing = res.data.followed; 
            const updatedFollowers = isNowFollowing 
              ? [...(u.followers || []), auth0User.sub]
              : (u.followers || []).filter(id => id !== auth0User.sub);
            return { ...u, followers: updatedFollowers };
          }
          return u;
        })
      );
    } catch (err) {
      console.error("Neural Link failed", err.response?.data || err.message);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) || 
      user.nickname?.toLowerCase().includes(searchLower) ||
      user.auth0Id?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) return (
    <div className="p-10 text-cyan-400 animate-pulse font-black italic flex flex-col justify-center items-center h-screen uppercase tracking-widest bg-[#020617]">
      <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
      SYNCHRONIZING WITH NEURAL GRID...
    </div>
  );

  return (
    <div className="p-6 bg-transparent min-h-screen font-sans max-w-7xl mx-auto">
      
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
          >
            <FaArrowLeft /> Back to Drift
          </button>
          <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <FaRocket className="text-cyan-500" /> NEURAL DISCOVERY
          </h1>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">
            {targetUserId ? `Target Lock: ${targetUserId}` : "Detecting drifters in your sector"}
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Search Identity Name or ID..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs outline-none focus:border-cyan-500/50 transition-all backdrop-blur-xl shadow-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
          {searchTerm && (
            <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-white font-bold"
            >
                CLEAR
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isFollowing = user.followers?.includes(auth0User?.sub);
            const isTarget = user.auth0Id === targetUserId;

            return (
              <div 
                key={user.auth0Id} 
                className={`backdrop-blur-2xl border rounded-[2.5rem] p-7 group shadow-2xl relative transition-all duration-500 ${
                    isTarget 
                    ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/20' 
                    : 'bg-[#0f172a]/40 border-white/5 hover:border-white/10'
                }`}
              >
                {isTarget && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[8px] font-black px-4 py-1 rounded-full tracking-widest uppercase">
                        Signal Found
                    </div>
                )}

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                      className="w-24 h-24 rounded-[2.2rem] object-cover border-4 border-white/5 group-hover:border-cyan-500/50 transition-all duration-500"
                      alt={user.name}
                    />
                    {isFollowing && (
                        <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black p-1.5 rounded-full border-4 border-[#0b1120]">
                            <FaUserCheck size={10} />
                        </div>
                    )}
                  </div>
                  <h3 className="text-white font-black text-xl mt-5 italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                    {user.name}
                  </h3>
                  <p className="text-cyan-400/40 text-[9px] font-black tracking-[0.3em] uppercase mt-1">
                    @{user.nickname || "drifter"}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
                  <button 
                    onClick={() => handleFollow(user.auth0Id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all border ${
                      isFollowing 
                      ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border-transparent' 
                      : 'bg-white/5 text-cyan-500 border-white/5 hover:bg-white/10 hover:border-cyan-500/30'
                    }`}
                  >
                    {isFollowing ? <FaUserCheck size={18} /> : <FaUserPlus size={18} />}
                    <span className="text-[7px] font-black uppercase tracking-widest">{isFollowing ? "Linked" : "Link"}</span>
                  </button>

                  <button 
                    onClick={() => navigate(`/messenger?userId=${user.auth0Id}`)} 
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 text-purple-500 rounded-3xl border border-white/5 hover:bg-purple-600 hover:text-white transition-all group/btn"
                  >
                    <FaEnvelope size={18} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Chat</span>
                  </button>

                  <button 
                    onClick={() => navigate(`/call/${user.auth0Id?.replace('|', '_')}`)} 
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 text-emerald-500 rounded-3xl border border-white/5 hover:bg-emerald-600 hover:text-white transition-all group/btn"
                  >
                    <FaPhoneAlt size={18} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Call</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20">
            <p className="text-gray-600 font-black uppercase tracking-[0.5em] italic">No drifters detected in this sector</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;