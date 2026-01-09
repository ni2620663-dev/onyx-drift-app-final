import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { FaUserPlus, FaEnvelope, FaPhoneAlt, FaCheckCircle, FaRocket, FaUserCheck, FaSearch } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const FollowingPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const { getAccessTokenSilently, user: currentUser } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = "https://onyx-drift-app-final.onrender.com";

  const fetchUsers = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ফলো বাটনের রিয়েল-টাইম ফিক্স
  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/user/follow/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // UI আপডেট: fetchUsers() কল না করে সরাসরি স্টেট পরিবর্তন (Fast UI)
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.auth0Id === targetId) {
            const updatedFollowers = res.data.isFollowing 
              ? [...(u.followers || []), currentUser.sub]
              : (u.followers || []).filter(id => id !== currentUser.sub);
            return { ...u, followers: updatedFollowers };
          }
          return u;
        })
      );
    } catch (err) {
      console.error("Follow failed", err);
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
    <div className="p-10 text-cyan-400 animate-pulse font-black italic flex justify-center items-center h-screen uppercase tracking-widest">
      SCANNING NEURAL NETWORK...
    </div>
  );

  return (
    <div className="p-6 bg-transparent min-h-screen font-sans">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <FaRocket className="text-cyan-500" /> NEURAL DISCOVERY
          </h1>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">Sync with drifters</p>
        </div>

        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Search by name, nickname or ID..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs outline-none focus:border-cyan-500/50 transition-all backdrop-blur-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.map((user) => {
          // চেক করছি বর্তমান ইউজার তাকে ফলো করছে কি না
          const isFollowing = user.followers?.includes(currentUser?.sub);

          return (
            <div key={user.auth0Id} className="bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-7 group shadow-2xl relative">
              <div className="flex flex-col items-center text-center relative z-10">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                  className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white/5 group-hover:border-cyan-500/50 transition-all"
                />
                <h3 className="text-white font-black text-xl mt-5 italic uppercase tracking-tight">{user.name}</h3>
                <p className="text-cyan-400/40 text-[9px] font-black tracking-[0.3em] uppercase mt-1">@{user.nickname}</p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
                <button 
                  onClick={() => handleFollow(user.auth0Id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all border ${
                    isFollowing ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/5 text-cyan-500 border-white/5 hover:bg-cyan-500 hover:text-white'
                  }`}
                >
                  {isFollowing ? <FaUserCheck size={18} /> : <FaUserPlus size={18} />}
                  <span className="text-[7px] font-black uppercase tracking-widest">{isFollowing ? "Linked" : "Follow"}</span>
                </button>

                <button onClick={() => navigate(`/messenger?userId=${user.auth0Id}`)} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 text-purple-500 rounded-3xl border border-white/5 hover:bg-purple-600 hover:text-white transition-all">
                  <FaEnvelope size={18} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Chat</span>
                </button>

                <button onClick={() => alert(`Calling...`)} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 text-emerald-500 rounded-3xl border border-white/5 hover:bg-emerald-600 hover:text-white transition-all">
                  <FaPhoneAlt size={18} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Call</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FollowingPage;