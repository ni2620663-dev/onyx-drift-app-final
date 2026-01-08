import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { FaUserPlus, FaEnvelope, FaPhoneAlt, FaCheckCircle, FaRocket, FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FollowingPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getAccessTokenSilently, user: currentUser } = useAuth0();
  const navigate = useNavigate();

  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // ১. সব ইউজারদের ডাটা নিয়ে আসা
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

  // ২. ফলো/আনফলো করার লজিক
  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/user/follow/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // লিস্ট রিফ্রেশ করা
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return (
    <div className="p-10 text-cyan-400 animate-pulse font-black italic flex justify-center items-center h-screen">
      SCANNING NEURAL NETWORK...
    </div>
  );

  return (
    <div className="p-6 bg-transparent min-h-screen">
      {/* হেডার সেকশন */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
          <FaRocket className="text-cyan-500" />
          NEURAL DISCOVERY
        </h1>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-[0.3em]">
          Connect with other drifters in the network
        </p>
      </div>

      {/* ইউজার কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((user) => {
          // চেক করা আপনি তাকে অলরেডি ফলো করছেন কি না (আপনার ব্যাকএন্ড মডেল অনুযায়ী)
          const isFollowing = user.followers?.includes(currentUser?.sub);

          return (
            <div key={user.auth0Id} className="bg-[#0f172a]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 hover:border-cyan-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
              
              {/* ইউজার প্রোফাইল ইনফো */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img 
                    src={user.avatar || 'https://via.placeholder.com/150'} 
                    alt={user.name} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/5 group-hover:border-cyan-500/50 transition-all duration-500 shadow-2xl"
                  />
                  <div className="absolute bottom-1 right-1 bg-cyan-500 p-1.5 rounded-full border-4 border-[#0f172a]">
                    <FaCheckCircle className="text-white text-[10px]" />
                  </div>
                </div>
                
                <h3 className="text-white font-black text-xl mt-4 italic uppercase tracking-tight">
                  {user.name}
                </h3>
                <p className="text-cyan-400/60 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                  @{user.nickname || 'drifter'}
                </p>
                <p className="text-gray-400 text-xs mt-3 line-clamp-2 italic px-4 leading-relaxed">
                  {user.bio || "Searching for neural stability..."}
                </p>
              </div>

              {/* অ্যাকশন বাটন গ্রুপ */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {/* ফলো বাটন */}
                <button 
                  onClick={() => handleFollow(user.auth0Id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 border ${
                    isFollowing 
                    ? 'bg-cyan-500 text-white border-cyan-500' 
                    : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500 hover:text-white'
                  }`}
                  title={isFollowing ? "Unfollow" : "Follow"}
                >
                  {isFollowing ? <FaUserCheck size={16} /> : <FaUserPlus size={16} />}
                  <span className="text-[8px] font-black uppercase">
                    {isFollowing ? "Linked" : "Follow"}
                  </span>
                </button>

                {/* চ্যাট বাটন (মেসেঞ্জারে আইডি পাঠাবে) */}
                <button 
                  onClick={() => navigate(`/messenger?userId=${user.auth0Id}`)}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white rounded-2xl transition-all duration-300 border border-purple-500/20"
                  title="Message"
                >
                  <FaEnvelope size={16} />
                  <span className="text-[8px] font-black uppercase">Chat</span>
                </button>

                {/* কল বাটন */}
                <button 
                  onClick={() => alert(`Starting Neural Call with ${user.name}...`)}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl transition-all duration-300 border border-emerald-500/20"
                  title="Call"
                >
                  <FaPhoneAlt size={16} />
                  <span className="text-[8px] font-black uppercase">Call</span>
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