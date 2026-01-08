import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaUserPlus, FaEnvelope, FaPhoneAlt, FaCheckCircle, 
  FaRocket, FaUserCheck, FaSearch 
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const FollowingPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const { getAccessTokenSilently, user: currentUser } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // ১. ফিড থেকে আসা userId হ্যান্ডেল করা (URL প্যারামিটার থেকে)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userIdFromFeed = queryParams.get("userId");
    if (userIdFromFeed) {
      setSearchTerm(userIdFromFeed);
    }
  }, [location.search]);

  // ২. সব ইউজারদের ডাটা নিয়ে আসা
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

  // ৩. ফলো/আনফলো করার লজিক
  const handleFollow = async (targetId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/user/follow/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); 
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  // ৪. ফিল্টারিং লজিক ফিক্স (আইডি, নাম এবং ডাকনামের সমন্বয়)
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true; // সার্চ টার্ম না থাকলে সব ইউজার দেখাবে
    
    const searchLower = searchTerm.toLowerCase();
    
    // Auth0 ID সাধারণত হুবহু ম্যাচ করতে হয়, তাই এখানে আংশিক এবং হুবহু দুইটাই চেক করা হচ্ছে
    return (
      user.auth0Id?.toLowerCase().includes(searchLower) || 
      user.name?.toLowerCase().includes(searchLower) || 
      user.nickname?.toLowerCase().includes(searchLower) ||
      user.auth0Id === searchTerm
    );
  });

  if (loading) return (
    <div className="p-10 text-cyan-400 animate-pulse font-black italic flex justify-center items-center h-screen uppercase tracking-widest">
      SCANNING NEURAL NETWORK...
    </div>
  );

  return (
    <div className="p-6 bg-transparent min-h-screen font-sans">
      
      {/* হেডার এবং সার্চ বার সেকশন */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <FaRocket className="text-cyan-500" />
            NEURAL DISCOVERY
          </h1>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">
            Sync with drifters across the network
          </p>
        </div>

        {/* প্রিমিয়াম গ্লাস-মরফিজম সার্চ বার */}
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
            <FaSearch className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, nickname or ID..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all backdrop-blur-xl placeholder:text-gray-600 font-bold uppercase tracking-wider"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-cyan-500 group-focus-within:w-full transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        </div>
      </div>

      {/* ইউজার কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isFollowing = user.followers?.includes(currentUser?.sub);

            return (
              <div key={user.auth0Id} className="bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-7 hover:border-cyan-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden">
                
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full group-hover:bg-cyan-500/10 transition-colors"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`} 
                      alt={user.name} 
                      className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white/5 group-hover:border-cyan-500/50 transition-all duration-500 rotate-3 group-hover:rotate-0 shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-cyan-500 p-2 rounded-xl border-4 border-[#0a0f1d] shadow-lg">
                      <FaCheckCircle className="text-white text-[10px]" />
                    </div>
                  </div>
                  
                  <h3 className="text-white font-black text-xl mt-5 italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                    {user.name}
                  </h3>
                  <p className="text-cyan-400/40 text-[9px] font-black tracking-[0.3em] uppercase mt-1">
                    @{user.nickname || 'drifter'}
                  </p>
                  <p className="text-gray-500 text-[11px] mt-4 italic px-4 leading-relaxed font-medium line-clamp-2">
                    {user.bio || "Searching for neural stability..."}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
                  <button 
                    onClick={() => handleFollow(user.auth0Id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all duration-300 border ${
                      isFollowing 
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                      : 'bg-white/5 text-cyan-500 border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500 hover:text-white'
                    }`}
                  >
                    {isFollowing ? <FaUserCheck size={18} /> : <FaUserPlus size={18} />}
                    <span className="text-[7px] font-black uppercase tracking-widest">
                      {isFollowing ? "Linked" : "Follow"}
                    </span>
                  </button>

                  <button 
                    onClick={() => navigate(`/messenger?userId=${user.auth0Id}`)}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-purple-600 text-purple-500 hover:text-white rounded-3xl transition-all duration-300 border border-white/5 hover:border-purple-500/50 group/chat"
                  >
                    <FaEnvelope size={18} className="group-hover/chat:scale-110 transition-transform" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Chat</span>
                  </button>

                  <button 
                    onClick={() => alert(`Initiating secure call...`)}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-3xl transition-all duration-300 border border-white/5 hover:border-emerald-500/50 group/call"
                  >
                    <FaPhoneAlt size={18} className="group-hover/call:animate-shake" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Call</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-20">
            <FaSearch size={50} className="mb-4 text-gray-500" />
            <p className="italic text-white uppercase tracking-[0.5em] text-sm font-black text-center px-6">
              No neural match found in this frequency...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;