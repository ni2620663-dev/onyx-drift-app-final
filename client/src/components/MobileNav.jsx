import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Play, Plus, MessageSquare, Users } from "lucide-react"; 

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // যে পেজগুলোতে নেভবার হাইড থাকবে
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

  const handlePlusClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      navigate('/reels-editor', { 
        state: { videoFile: file, type: fileType } 
      });
    }
    // ইনপুট ভ্যালু রিসেট করা যাতে একই ফাইল বারবার সিলেক্ট করা যায়
    e.target.value = '';
  };

  return (
    <>
      {/* Hidden File Input - বাটন থেকে আলাদা রাখা হয়েছে যাতে ইভেন্ট ক্ল্যাশ না করে */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="video/*,image/*" 
        className="hidden" 
      />

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-black/90 backdrop-blur-2xl border-t border-white/[0.05] pb-8 pt-3 px-6 pointer-events-auto"
      >
        <div className="flex items-center justify-between max-w-md mx-auto h-12">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                if (item.isMain) {
                  handlePlusClick(e);
                } else {
                  navigate(item.path);
                }
              }}
              className="flex-1 flex flex-col items-center justify-center outline-none relative cursor-pointer active:scale-90 transition-transform"
            >
              {item.isMain ? (
                <motion.div 
                  whileTap={{ scale: 0.85 }}
                  className="w-12 h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/[0.12]"
                >
                  <Plus size={24} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div 
                    className={`transition-all duration-300 ${
                      isActive(item.path) ? 'text-cyan-400' : 'text-zinc-500'
                    }`}
                  >
                    {React.cloneElement(item.icon, { 
                      fill: isActive(item.path) ? "currentColor" : "none",
                      strokeWidth: isActive(item.path) ? 2.5 : 2
                    })}
                  </div>
                  
                  {/* Active Indicator Dot */}
                  <AnimatePresence>
                    {isActive(item.path) && (
                      <motion.div 
                        layoutId="navIndicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default MobileNav;
