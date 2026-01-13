import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// স্ক্রিনশটের মতো আউটলাইন আইকনের জন্য Lucide React ব্যবহার করা হয়েছে
import { Home, Play, Plus, MessageSquare, Users } from "lucide-react"; 

const MobileNav = ({ userAuth0Id }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: <Home size={24} />, path: "/feed", id: "home" },
    { icon: <Play size={24} />, path: "/reels", id: "reels" }, // স্ক্রিনশটের মতো Reels আইকন
    { icon: <Plus size={24} />, path: "/create", isMain: true },
    { icon: <MessageSquare size={24} />, path: "/messages", id: "messages" },
    { icon: <Users size={24} />, path: "/following", id: "following" }, // প্রোফাইলের বদলে ফলোয়িং আইকন
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-[999]">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 h-16 rounded-[2.5rem] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      >
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="relative flex flex-col items-center justify-center w-12 h-12 outline-none"
          >
            {item.isMain ? (
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-gradient-to-tr from-cyan-500 to-purple-600 p-4 rounded-full -translate-y-8 shadow-lg shadow-cyan-500/40 border-[6px] border-[#020617] flex items-center justify-center"
              >
                <Plus className="text-white" size={24} strokeWidth={3} />
              </motion.div>
            ) : (
              <div className={`transition-all duration-300 ${isActive(item.path) ? 'text-cyan-400 scale-110' : 'text-gray-400 opacity-70'}`}>
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