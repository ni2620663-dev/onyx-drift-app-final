import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaRegBell, FaSignOutAlt, FaUserCircle, FaUserCheck, 
  FaPlus, FaFileAlt, FaCamera, FaVideo, FaBroadcastTower 
} from 'react-icons/fa'; 
import { HiOutlineMenuAlt4 } from "react-icons/hi"; 
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import webSocketService from "../services/WebSocketService"; 

const Navbar = ({ setIsPostModalOpen, toggleSidebar }) => { 
  const navigate = useNavigate();
  const { user, logout, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // আপনার Render URL টি একবার চেক করে নিন, ERR_NAME_NOT_RESOLVED মানে ডোমেইন ঠিক নেই
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // ১. সার্চ লজিক (Debounced Search)
  useEffect(() => {
    const fetchResults = async () => {
      if (localSearch.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const res = await axios.get(`${API_URL}/api/user/search`, {
          params: { query: localSearch },
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
        setShowResults(true);
      } catch (err) {
        console.error("Search sync failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(fetchResults, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [localSearch, getAccessTokenSilently]);

  // ২. নোটিফিকেশন সাবস্ক্রিপশন
  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const subscription = webSocketService.subscribe(`/topic/notifications/${user.sub}`, () => {
        setHasNewNotification(true);
      });
      return () => { if (subscription) subscription.unsubscribe(); };
    }
  }, [user, isAuthenticated]);

  return (
    <nav className="w-full h-[60px] bg-[#030303]/90 backdrop-blur-xl border-b border-white/[0.05] z-[1000] flex items-center justify-between px-4 lg:px-8 relative">
      
      {/* Left Section: Menu & Logo */}
      <div className="flex items-center gap-3">
        <HiOutlineMenuAlt4 
          size={22} 
          onClick={(e) => {
            e.stopPropagation();
            if(typeof toggleSidebar === 'function') toggleSidebar();
          }} 
          className="text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors" 
        />
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/feed')}>
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-black font-black text-xs italic tracking-tighter">OX</span>
          </div>
          <h1 className="text-lg font-black text-white italic tracking-tighter uppercase hidden sm:block">
            ONYX<span className="text-cyan-500">DRIFT</span>
          </h1>
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-[400px] mx-4 relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <FaSearch size={12} className={`${loading ? 'animate-spin text-cyan-500' : 'text-gray-500'}`} />
          </div>
          <input 
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => localSearch.length > 0 && setShowResults(true)}
            placeholder="Scan Identity or ID..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600 shadow-inner"
          />
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <>
              <div className="fixed inset-0 z-[10]" onClick={() => setShowResults(false)}></div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
              >
                {searchResults.map((result) => (
                  <div 
                    key={result.auth0Id}
                    onClick={() => {
                      navigate(`/following?userId=${encodeURIComponent(result.auth0Id)}`);
                      setShowResults(false);
                      setLocalSearch("");
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-all border-b border-white/[0.03] last:border-0"
                  >
                    <img src={result.avatar} className="w-8 h-8 rounded-full border border-white/10 object-cover" alt="U" />
                    <div className="flex flex-col">
                      <span className="text-white text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                        {result.name} {result.isVerified && <FaUserCheck className="text-cyan-500" size={8} />}
                      </span>
                      <span className="text-gray-500 text-[8px] font-bold">@{result.nickname || 'drifter'}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Right Section: Plus Menu, Notifications & Profile */}
      <div className="flex items-center gap-3 lg:gap-6">
        
        {/* NEW: Plus (+) Broadcast Menu (লাল মার্ক করা জায়গায়) */}
        <div className="relative">
          <button 
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-cyan-500 flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <FaPlus size={14} className={`${showPlusMenu ? 'rotate-45' : 'rotate-0'} transition-transform duration-300`} />
          </button>

          <AnimatePresence>
            {showPlusMenu && (
              <>
                <div className="fixed inset-0 z-[1001]" onClick={() => setShowPlusMenu(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 mt-4 w-52 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl z-[1002] overflow-hidden"
                >
                  <div className="text-[8px] font-black text-gray-500 px-3 py-2 uppercase tracking-[0.2em]">Signal Type</div>
                  {[
                    { icon: <FaFileAlt />, label: 'Text Post', color: 'text-cyan-400' },
                    { icon: <FaCamera />, label: 'Neural Photo', color: 'text-purple-400' },
                    { icon: <FaVideo />, label: 'Drift Reel', color: 'text-emerald-400' },
                    { icon: <FaBroadcastTower />, label: 'Live Broadcast', color: 'text-rose-500' },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setIsPostModalOpen(true); setShowPlusMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-[9px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-xl uppercase transition-all text-left"
                    >
                      <span className={item.color}>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div 
          className="relative cursor-pointer group"
          onClick={() => {
            setHasNewNotification(false);
            navigate('/notifications');
          }}
        >
          <FaRegBell size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
          {hasNewNotification && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-500 rounded-full border border-[#030303] animate-pulse"></span>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="flex items-center gap-2 bg-white/5 p-1 lg:pr-3 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <img src={user?.picture} className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-cyan-500/30 object-cover" alt="Avatar" />
            <span className="hidden lg:block text-[9px] font-black text-white uppercase tracking-widest">
              {user?.nickname?.substring(0, 8)}
            </span>
          </div>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-[1001]" onClick={() => setShowDropdown(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-44 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden z-[1002]"
                >
                  <button 
                    onClick={() => { navigate(`/profile/${user?.sub}`); setShowDropdown(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[9px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-xl uppercase transition-all text-left"
                  >
                    <FaUserCircle size={14} /> Profile
                  </button>
                  <div className="h-[1px] bg-white/5 my-1"></div>
                  <button 
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[9px] font-black text-rose-500 hover:bg-rose-500/10 rounded-xl uppercase transition-all text-left"
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