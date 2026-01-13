import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// ছবির মতো আউটলাইন আইকনের জন্য Lucide React ব্যবহার করা হয়েছে
import { Home, Play, Plus, MessageSquare, Users } from "lucide-react"; 

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: <Home size={22} />, path: "/feed", id: "home" },
    { icon: <Play size={22} />, path: "/reels", id: "reels" },
    { icon: <Plus size={26} />, path: "/create", isMain: true },
    { icon: <MessageSquare size={22} />, path: "/messages", id: "messages" },
    { icon: <Users size={22} />, path: "/following", id: "following" },
  ];

 const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-[#000000] border-t border-white/[0.03] pt-2 pb-6 px-6">
      <div className="flex items-center justify-between max-w-md mx-auto h-12">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.path)}
            className="flex-1 flex items-center justify-center outline-none"
          >
            {item.isMain ? (
              /* ছবির মতো ডার্ক স্কয়ার প্লাস বাটন */
              <div className="w-12 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 active:scale-95 transition-all">
                <Plus size={22} strokeWidth={2.5} />
              </div>
            ) : (
              /* হালকা সাদা আইকন যা একটিভ হলে উজ্জ্বল হবে */
              <div 
                className={`transition-all duration-300 ${
                  isActive(item.path) 
                    ? 'text-white scale-110' 
                    : 'text-white/20 hover:text-white/40'
                }`}
              >
                {/* আইকনটি একটিভ থাকলে Fill হবে */}
                {React.cloneElement(item.icon, { 
                    fill: isActive(item.path) ? "currentColor" : "none",
                    strokeWidth: isActive(item.path) ? 2.5 : 2
                })}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;