import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaVideo, FaPlus, FaBell, FaUserAlt } from "react-icons/fa";
import { motion } from "framer-motion";

const MobileNav = ({ userAuth0Id }) => { // প্রোফাইলের জন্য ইউজার আইডি পাস করা হয়েছে
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: <FaHome />, path: "/", id: "home" },
    { icon: <FaVideo />, path: "/reels", id: "reels" }, // 🎬 Reels বাটন
    { icon: <FaPlus />, path: "/create", isMain: true },
    { icon: <FaUserAlt />, path: `/profile/${userAuth0Id || ""}`, id: "profile" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-[999]"> {/* Z-Index বাড়িয়ে দেওয়া হয়েছে */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/60 backdrop-blur-2xl border border-white/10 h-16 rounded-[2.5rem] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      >
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
                console.log("Navigating to:", item.path); // ডিবাগ করার জন্য
                navigate(item.path);
            }}
            className="relative flex flex-col items-center justify-center w-12 h-12"
          >
            {item.isMain ? (
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-gradient-to-tr from-cyan-500 to-purple-600 p-4 rounded-full -translate-y-8 shadow-lg shadow-cyan-500/40 border-[6px] border-[#020617] flex items-center justify-center"
              >
                <FaPlus className="text-white text-xl" />
              </motion.div>
            ) : (
              <div className={`text-xl transition-all duration-300 ${isActive(item.path) ? 'text-cyan-400 scale-110' : 'text-gray-400 opacity-70'}`}>
                {item.icon}
                {isActive(item.path) && (
                  <motion.div 
                    layoutId="mobileNavTab"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                )}
              </div>
            )}
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export default MobileNav;