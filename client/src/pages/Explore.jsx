import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { FaUserPlus, FaUserCheck, FaSearch } from "react-icons/fa";

const Explore = () => {
  const { user } = useAuth0();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`);
        // নিজের প্রোফাইল বাদে বাকিদের ফিল্টার করে রাখা
        setUsers(res.data.filter((u) => u.userId !== user?.sub));
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    };
    fetchUsers();
  }, [user?.sub]);

  const handleFollow = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/users/${userId}/follow`);
      // UI আপডেট করার জন্য পুনরায় ডাটা ফেচ করা যেতে পারে অথবা লোকাল স্টেট আপডেট করা যায়
      window.location.reload(); 
    } catch (err) {
      alert("Follow failed!");
    }
  };

  // সার্চ লজিক
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-8">Explore People</h1>

        {/* Search Bar */}
        <div className="relative mb-8">
          <FaSearch className="absolute left-4 top-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name..."
            className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((otherUser) => (
            <div key={otherUser._id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 text-center transition-transform hover:scale-105">
              <img
                src={otherUser.avatar || "https://via.placeholder.com/100"}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100"
                alt=""
              />
              <h3 className="font-bold text-lg dark:text-white mb-1">{otherUser.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-1">{otherUser.bio || "No bio yet"}</p>
              
              <button
                onClick={() => handleFollow(otherUser._id)}
                className={`w-full py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                  otherUser.followers.includes(user?.sub)
                    ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {otherUser.followers.includes(user?.sub) ? (
                  <><FaUserCheck /> Following</>
                ) : (
                  <><FaUserPlus /> Follow</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;