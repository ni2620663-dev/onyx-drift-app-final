import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaBell, FaSignOutAlt } from 'react-icons/fa'; 
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

  // মোবাইলে এই নেভবারটি হাইড থাকবে কারণ পেইজের ভেতর অলরেডি হেডার আছে
  return (
    <nav className="hidden lg:flex h-[75px] px-6 items-center justify-between bg-black border-b border-white/5 w-full sticky top-0 z-[200]">
      
      {/* ১. লোগো সেকশন */}
      <div className="flex items-center gap-3 min-w-fit cursor-pointer" onClick={() => navigate('/feed')}>
        <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="text-black font-black text-lg italic tracking-tighter">OX</span>
        </div>
        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">
          ONYX<span className="text-cyan-500">DRIFT</span>
        </h1>
      </div>

      {/* ২. সার্চ বার */}
      <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-full max-w-sm mx-4 focus-within:border-cyan-500/50 transition-all">
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

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-3 w-full bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[300]"
            >
              <div className="p-3 border-b border-white/5 text-[9px] font-black text-gray-500 uppercase flex justify-between">
                <span>Search Results</span>
                <span className="text-cyan-500">{loading ? "Scanning..." : "Syncing"}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {searchResults.map((result) => (
                  <div 
                    key={result._id} 
                    onClick={() => { navigate(`/profile/${result.auth0Id || result._id}`); setShowResults(false); setLocalSearch(""); }} 
                    className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none group"
                  >
                    <img src={result.avatar || result.picture} className="w-9 h-9 rounded-xl object-cover border border-white/10" alt="" />
                    <p className="text-[12px] font-bold text-white uppercase tracking-tighter">{result.nickname || result.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ৩. রাইট অ্যাকশন বাটনসমূহ */}
      <div className="flex items-center gap-4 min-w-fit">
        <div className="relative">
          <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <FaBell size={18} />
            {hasNewNotification && <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-black"></span>}
          </button>
        </div>

        <div className="relative">
            <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white/5 p-1 pr-3 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
            >
                <img src={user?.picture} className="w-7 h-7 rounded-full border border-cyan-500/40" alt="Avatar" />
                <span className="hidden sm:block text-[10px] font-black text-white uppercase tracking-widest">{user?.nickname?.substring(0, 8)}</span>
            </div>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-44 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden"
                    >
                        <button 
                            onClick={() => { navigate(`/profile/${user?.sub}`); setShowDropdown(false); }}
                            className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-xl uppercase transition-all"
                        >
                            View Profile
                        </button>
                        <button 
                            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                            className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black text-rose-500 hover:bg-rose-500/10 rounded-xl uppercase transition-all"
                        >
                            <FaSignOutAlt /> Sign Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;