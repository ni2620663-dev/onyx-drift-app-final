import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { FaUserPlus, FaUserCheck, FaSearch } from "react-icons/fa";
import { Loader } from "lucide-react";

const Explore = () => {
  const { user } = useAuth0();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Render বা লোকালহোস্টের জন্য API URL
  const API_URL = import.meta.env.VITE_API_URL || "https://onyx-drift-app-final.onrender.com";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/all`); // আপনার ব্যাকএন্ড রাুট অনুযায়ী
        // নিজেকে বাদ দিয়ে বাকিদের লিস্টে রাখা
        setUsers(res.data.filter((u) => u.auth0Id !== user?.sub));
        setLoading(false);
      } catch (err) {
        console.error("Fetch users error:", err);
        setLoading(false);
      }
    };
    if (user?.sub) fetchUsers();
  }, [user?.sub, API_URL]);

  const handleFollow = async (targetUserId) => {
    try {
      // ব্যাকএন্ডে ফলো রিকোয়েস্ট পাঠানো
      await axios.post(`${API_URL}/api/user/follow`, {
        currentUserId: user.sub,
        targetUserId: targetUserId
      });
      
      // লোকাল স্টেট আপডেট করা যাতে রিলোড ছাড়া বাটন চেঞ্জ হয়
      const updatedUsers = users.map(u => {
        if (u._id === targetUserId) {
          const isFollowing = u.followers.includes(user.sub);
          return {
            ...u,
            followers: isFollowing 
              ? u.followers.filter(id => id !== user.sub) 
              : [...u.followers, user.sub]
          };
        }
        return u;
      });
      setUsers(updatedUsers);
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Loader className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-[#010409] transition-colors duration-300">
      <div className="w-full max-w-6xl mx-auto px-4 py-12 flex flex-col items-center">
        
        {/* ১. হেডার সেকশন */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-800 dark:text-white mb-4 tracking-tight">
            EXPLORE <span className="text-blue-600">DRIFTERS</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm uppercase tracking-widest">
            Neural network connections in the Onyx grid.
          </p>
        </div>

        {/* ২. সার্চ বার */}
        <div className="flex justify-center mb-16 w-full px-4">
          <div className="relative w-full max-w-xl">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="SEARCH BY NICKNAME..."
              className="w-full p-5 pl-14 rounded-2xl border-none bg-white dark:bg-gray-800 shadow-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all uppercase text-xs tracking-widest"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ৩. ইউজার গ্রিড */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {filteredUsers.map((otherUser) => {
              const isFollowing = otherUser.followers?.includes(user?.sub);
              
              return (
                <div 
                  key={otherUser._id} 
                  className="bg-white dark:bg-gray-800/50 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 text-center transition-all hover:shadow-2xl hover:border-blue-500/30 group"
                >
                  <div className="relative inline-block mb-6">
                    <img
                      src={otherUser.profilePic || otherUser.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.nickname}`}
                      className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-500/20 shadow-lg group-hover:scale-110 transition-transform duration-300"
                      alt={otherUser.nickname}
                    />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
                  </div>

                  <h3 className="font-black text-xl dark:text-white mb-1 uppercase tracking-tighter">
                    {otherUser.nickname || otherUser.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                     <span className="text-[10px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                        {otherUser.neuralRank || "Neophyte"}
                     </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 line-clamp-2 min-h-[32px] uppercase">
                    {otherUser.bio || "Inhabiting the Onyx Drift network."}
                  </p>
                  
                  <button
                    onClick={() => handleFollow(otherUser._id)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                      isFollowing
                        ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                    }`}
                  >
                    {isFollowing ? (
                      <><FaUserCheck size={16} /> Following</>
                    ) : (
                      <><FaUserPlus size={16} /> Connect</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 uppercase tracking-widest text-sm">No drifters found in this sector...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;