import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// ছবির মতো আউটলাইন আইকনের জন্য Lucide React ব্যবহার করা হয়েছে
import { Home, Play, Plus, MessageSquare, Users } from "lucide-react"; 

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // ১. মেসেঞ্জার, চ্যাট বা কল পেজে থাকলে ন্যাভিগেশন বারটি লুকানোর লজিক
  // এখানে শুধু "/call" যোগ করা হয়েছে যাতে ভিডিও কলের সময় বাটনগুলো ঢেকে না যায়
  const hidePaths = ["/messages", "/chat", "/reels-editor", "/call"];
  const shouldHide = hidePaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const navItems = [
    { icon: <Home size={22} />, path: "/feed" },
    { icon: <Play size={22} />, path: "/reels" },
    { icon: <Plus size={26} />, path: "/create", isMain: true },
    { icon: <MessageSquare size={22} />, path: "/messages" },
    { icon: <Users size={22} />, path: "/following" },
  ];

  const isActive = (path) => location.pathname === path;

  const handlePlusClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      
      // ফাইলটি নিয়ে সরাসরি এডিটর পেজে পাঠানো
      navigate('/reels-editor', { 
        state: { 
          videoFile: file,
          type: fileType 
        } 
      });
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-[999] bg-black/95 backdrop-blur-xl border-t border-white/[0.05] pt-2 pb-6 px-6"
    >
      <div className="flex items-center justify-between max-w-md mx-auto h-12">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => item.isMain ? handlePlusClick() : navigate(item.path)}
            className="flex-1 flex items-center justify-center outline-none relative"
          >
            {item.isMain ? (
              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="video/*,image/*" 
                  className="hidden" 
                />
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-white active:bg-cyan-500 active:text-black transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                >
                  <Plus size={22} strokeWidth={2.5} />
                </motion.div>
              </div>
            ) : (
              <div 
                className={`transition-all duration-300 flex flex-col items-center gap-1 ${
                  isActive(item.path) 
                    ? 'text-cyan-400 scale-110' 
                    : 'text-white/20 hover:text-white/40'
                }`}
              >
                {React.cloneElement(item.icon, { 
                    fill: isActive(item.path) ? "currentColor" : "none",
                    strokeWidth: isActive(item.path) ? 2.5 : 2
                })}
                {/* অ্যাক্টিভ ডট ইন্ডিকেটর */}
                {isActive(item.path) && (
                  <motion.div 
                    layoutId="navDot"
                    className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                  />
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default MobileNav;