import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaRegBell, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'; 
import { HiOutlineMenuAlt4 } from "react-icons/hi"; 
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import webSocketService from "../services/WebSocketService"; 

const Navbar = ({ setSearchQuery }) => {
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
    <nav className="fixed top-0 left-0 w-full h-[70px] bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.05] z-[1000] flex items-center justify-between px-4 lg:px-8">
      
      {/* ১. লোগো এবং মেনু সেকশন */}
      <div className="flex items-center gap-3 lg:gap-4">
        <HiOutlineMenuAlt4 size={24} className="text-gray-400 lg:hidden cursor-pointer" />
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/feed')}>
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-black font-black text-xs lg:text-lg italic tracking-tighter">OX</span>
          </div>
          <h1 className="text-lg lg:text-xl font-black text-white italic tracking-tighter uppercase hidden xs:block">
            ONYX<span className="text-cyan-500">DRIFT</span>
          </h1>
        </div>
      </div>

      {/* ২. সার্চ বার (ডেস্কটপে দৃশ্যমান, মোবাইলে আইকন হিসেবে কাজ করবে) */}
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-cyan-500/50 transition-all">
          <FaSearch className="text-gray-500 text-sm" />
          <input
            type="text"
            value={localSearch}
            placeholder="Search creators..."
            className="bg-transparent border-none outline-none px-3 text-[13px] w-full text-white placeholder-gray-600"
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (setSearchQuery) setSearchQuery(e.target.value);
            }}
            onFocus={() => localSearch.length > 0 && setShowResults(true)}
          />
        </div>

        {/* সার্চ রেজাল্ট ড্রপডাউন */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-3 w-full bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[1100]"
            >
              <div className="p-3 border-b border-white/5 text-[9px] font-black text-gray-500 uppercase flex justify-between">
                <span>Search Results</span>
                <span className="text-cyan-500">{loading ? "Scanning..." : "Syncing"}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {searchResults.length > 0 ? searchResults.map((result) => (
                  <div 
                    key={result._id} 
                    onClick={() => { navigate(`/profile/${result.auth0Id || result._id}`); setShowResults(false); setLocalSearch(""); }} 
                    className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none group"
                  >
                    <img src={result.avatar || result.picture} className="w-9 h-9 rounded-xl object-cover border border-white/10" alt="" />
                    <p className="text-[12px] font-bold text-white uppercase tracking-tighter">{result.nickname || result.name}</p>
                  </div>
                )) : (
                    <div className="p-4 text-center text-gray-600 text-xs italic tracking-widest">No Signals Found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ৩. রাইট অ্যাকশন বাটনসমূহ (সার্চ, বেল, প্রোফাইল) */}
      <div className="flex items-center gap-3 lg:gap-6">
        
        {/* মোবাইলে সার্চ আইকন (যদি ইনপুট ফিল্ড হাইড থাকে) */}
        <FaSearch className="text-gray-400 md:hidden cursor-pointer hover:text-white" size={18} />

        {/* নোটিফিকেশন */}
        <div className="relative cursor-pointer group">
          <FaRegBell size={20} className="text-gray-400 group-hover:text-white transition-colors" />
          {hasNewNotification && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-[#030303] animate-pulse"></span>
          )}
        </div>

        {/* ইউজার প্রোফাইল ড্রপডাউন */}
        <div className="relative">
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white/5 p-1 lg:pr-3 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all active:scale-95"
          >
            <img 
              src={user?.picture} 
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-cyan-500/30 object-cover" 
              alt="Avatar" 
            />
            <span className="hidden lg:block text-[10px] font-black text-white uppercase tracking-widest">
              {user?.nickname?.substring(0, 10)}
            </span>
          </div>

          <AnimatePresence>
            {showDropdown && (
              <>
                {/* ড্রপডাউন বন্ধ করার জন্য ব্যাকড্রপ */}
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowDropdown(false)}></div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-48 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <button 
                    onClick={() => { navigate(`/profile/${user?.sub}`); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-xl uppercase transition-all"
                  >
                    <FaUserCircle size={14} /> View Profile
                  </button>
                  <div className="h-[1px] bg-white/5 my-1"></div>
                  <button 
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-rose-500 hover:bg-rose-500/10 rounded-xl uppercase transition-all"
                  >
                    <FaSignOutAlt size={14} /> Sign Out
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