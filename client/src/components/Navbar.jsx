import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaRegBell, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'; 
import { HiOutlineMenuAlt4 } from "react-icons/hi"; 
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import webSocketService from "../services/WebSocketService"; 

const Navbar = ({ setSearchQuery, setIsPostModalOpen }) => { 
  const navigate = useNavigate();
  const { user, logout, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [showDropdown, setShowDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  // Notification Listener
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const subscription = webSocketService.subscribe(`/topic/notifications/${user.sub}`, (data) => {
        setHasNewNotification(true);
      });
      return () => { if (subscription) subscription.unsubscribe(); };
    }
  }, [user, isAuthenticated]);

  // Real-time Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (localSearch.trim().length > 0) {
        setLoading(true);
        try {
          const token = await getAccessTokenSilently();
          const res = await axios.get(`${API_URL}/api/user/search`, {
            params: { query: localSearch },
            headers: { Authorization: `Bearer ${token}` }
          });
          setSearchResults(res.data);
          setShowResults(true);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setShowResults(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [localSearch, getAccessTokenSilently, API_URL]);

  return (
    <nav className="fixed top-0 left-0 w-full h-[60px] bg-[#030303]/90 backdrop-blur-xl border-b border-white/[0.05] z-[1000] flex items-center justify-between px-4 lg:px-8">
      
      {/* ১. লোগো সেকশন */}
      <div className="flex items-center gap-3">
        <HiOutlineMenuAlt4 size={22} className="text-gray-400 lg:hidden cursor-pointer hover:text-cyan-400 transition-colors" />
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/feed')}>
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-black font-black text-xs italic tracking-tighter">OX</span>
          </div>
          <h1 className="text-lg font-black text-white italic tracking-tighter uppercase hidden sm:block">
            ONYX<span className="text-cyan-500">DRIFT</span>
          </h1>
        </div>
      </div>

      {/* ২. সেন্টার পোস্ট বার (মাঝখানে নতুন ডিজাইন) */}
      <div className="flex-1 max-w-[300px] mx-4 relative">
        <div 
          onClick={() => setIsPostModalOpen(true)}
          className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-[2px] group-hover:text-gray-300">
            Broadcast Signal...
          </span>
        </div>
      </div>

      {/* ৩. রাইট অ্যাকশন বাটনসমূহ */}
      <div className="flex items-center gap-3 lg:gap-6">
        
        {/* সার্চ আইকন (মোবাইল) */}
        <FaSearch className="text-gray-400 sm:hidden cursor-pointer hover:text-white" size={16} />

        {/* নোটিফিকেশন */}
        <div className="relative cursor-pointer group">
          <FaRegBell size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
          {hasNewNotification && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full border border-[#030303] animate-pulse"></span>
          )}
        </div>

        {/* ইউজার প্রোফাইল ড্রপডাউন */}
        <div className="relative">
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white/5 p-1 lg:pr-3 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <img 
              src={user?.picture} 
              className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-cyan-500/30 object-cover" 
              alt="Avatar" 
            />
            <span className="hidden lg:block text-[9px] font-black text-white uppercase tracking-widest">
              {user?.nickname?.substring(0, 8)}
            </span>
          </div>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowDropdown(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-44 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden"
                >
                  <button 
                    onClick={() => { navigate(`/profile/${user?.sub}`); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[9px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-xl uppercase transition-all"
                  >
                    <FaUserCircle size={14} /> Profile
                  </button>
                  <div className="h-[1px] bg-white/5 my-1"></div>
                  <button 
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[9px] font-black text-rose-500 hover:bg-rose-500/10 rounded-xl uppercase transition-all"
                  >
                    <FaSignOutAlt size={14} /> Log Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;