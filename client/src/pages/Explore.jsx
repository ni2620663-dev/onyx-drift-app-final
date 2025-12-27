import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { FaUserPlus, FaUserCheck, FaSearch } from "react-icons/fa";

const Explore = () => {
  const { user } = useAuth0();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`);
        setUsers(res.data.filter((u) => u.userId !== user?.sub));
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    };
    if (user?.sub) fetchUsers();
  }, [user?.sub, API_URL]);

  const handleFollow = async (targetUserId) => {
    try {
      await axios.post(`${API_URL}/api/users/${targetUserId}/follow`, {
        currentUserId: user.sub
      });
      
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
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* ১. হেডার সেকশন - সেন্টারে আনা হয়েছে */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-4">
            Explore People
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Discover new connections and grow your network on OnyxDrift.
          </p>
        </div>

        {/* ২. সার্চ বার - একদম মাঝখানে ফিক্স করা হয়েছে */}
        <div className="flex justify-center mb-16">
          <div className="relative w-full max-w-xl">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search users by name..."
              className="w-full p-4 pl-14 rounded-full border-none bg-white dark:bg-gray-800 shadow-lg focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ৩. ইউজার গ্রিড */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredUsers.map((otherUser) => (
              <div 
                key={otherUser._id} 
                className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-all hover:shadow-xl hover:-translate-y-2"
              >
                <div className="relative inline-block mb-4">
                  <img
                    src={otherUser.picture || otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.name}`}
                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-50 shadow-inner"
                    alt={otherUser.name}
                    onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
                  />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
                </div>

                <h3 className="font-bold text-xl dark:text-white mb-1">{otherUser.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 min-h-[40px]">
                  {otherUser.bio || "Building something amazing!"}
                </p>
                
                <button
                  onClick={() => handleFollow(otherUser._id)}
                  className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    otherUser.followers?.includes(user?.sub)
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none"
                  }`}
                >
                  {otherUser.followers?.includes(user?.sub) ? (
                    <><FaUserCheck /> Following</>
                  ) : (
                    <><FaUserPlus /> Follow</>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
             <p className="text-gray-400 text-lg italic">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;