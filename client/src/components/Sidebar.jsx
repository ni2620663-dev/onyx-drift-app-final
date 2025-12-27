import React from "react";
import { NavLink } from "react-router-dom";
import { 
  FaHome, FaThLarge, FaCompass, 
  FaUser, FaCog, FaCommentDots 
} from "react-icons/fa";

const Sidebar = () => {
  const menuItems = [
    { path: "/feed", icon: <FaHome size={24} />, label: "Home" },
    { path: "/dashboard", icon: <FaThLarge size={22} />, label: "Dashboard" },
    { path: "/explore", icon: <FaCompass size={24} />, label: "Explore" },
    { path: "/messenger", icon: <FaCommentDots size={24} />, label: "Messenger" },
    { path: "/profile", icon: <FaUser size={22} />, label: "Profile" },
    { path: "/settings", icon: <FaCog size={24} />, label: "Settings" },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-20 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col items-center py-8 space-y-8 z-50">
      {/* Logo বা উপরের আইকন */}
      <div className="text-blue-600 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
          O
        </div>
      </div>

      {/* মেনু আইকনগুলো */}
      <div className="flex flex-col space-y-4">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            title={item.label} // মাউস রাখলে নাম দেখাবে
            className={({ isActive }) => `
              p-4 rounded-2xl transition-all duration-300 group relative
              ${isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500"
              }
            `}
          >
            {item.icon}
            
            {/* Tooltip (ঐচ্ছিক: মাউস নিলে নাম দেখাবে) */}
            <span className="absolute left-20 scale-0 group-hover:scale-100 transition-all bg-gray-900 text-white text-xs p-2 rounded-lg ml-2 font-medium z-[100]">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;