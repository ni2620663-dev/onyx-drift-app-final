import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { FaUserCircle, FaUserFriends, FaUsers, FaStore, FaTv, FaClock, FaBookmark, FaChevronDown } from "react-icons/fa";

const Sidebar = () => {
  const { user } = useAuth0();

  const menuItems = [
    { path: "/friends", icon: <FaUserFriends size={22} className="text-cyan-500" />, label: "Friends" },
    { path: "/groups", icon: <FaUsers size={22} className="text-blue-500" />, label: "Groups" },
    { path: "/marketplace", icon: <FaStore size={22} className="text-blue-600" />, label: "Marketplace" },
    { path: "/watch", icon: <FaTv size={22} className="text-blue-400" />, label: "Watch" },
    { path: "/memories", icon: <FaClock size={22} className="text-blue-600" />, label: "Memories" },
    { path: "/saved", icon: <FaBookmark size={22} className="text-purple-600" />, label: "Saved" },
  ];

  return (
    <aside className="fixed left-0 top-[105px] h-[calc(100vh-105px)] w-64 hidden lg:flex flex-col py-2 px-4 overflow-y-auto no-scrollbar z-40 bg-[#f0f2f5]">
      {/* ইউজার প্রোফাইল লিঙ্ক */}
      <NavLink to="/profile" className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg transition">
        <img 
          src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"} 
          className="w-9 h-9 rounded-full object-cover border border-gray-300" 
          alt="user"
        />
        <span className="font-semibold text-[15px]">{user?.name || "User"}</span>
      </NavLink>

      {/* মেনু আইটেমসমূহ */}
      <div className="mt-2 space-y-1">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg transition group"
          >
            <div className="w-9 flex justify-center">{item.icon}</div>
            <span className="text-[15px] font-medium text-gray-800">{item.label}</span>
          </NavLink>
        ))}
        
        {/* See More বাটন */}
        <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg transition">
          <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center">
            <FaChevronDown size={14} />
          </div>
          <span className="text-[15px] font-medium">See more</span>
        </button>
      </div>

      <div className="mt-4 border-t border-gray-300 pt-4 text-xs text-gray-500 px-2">
        Privacy · Terms · Advertising · Cookies · More · Meta © 2025
      </div>
    </aside>
  );
};

export default Sidebar;