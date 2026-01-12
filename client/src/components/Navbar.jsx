import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaBell, FaCommentDots, FaCheckCircle, FaSignOutAlt, FaRegCommentDots } from 'react-icons/fa'; // FaRegCommentDots যোগ করা হয়েছে
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import webSocketService from "../services/WebSocketService"; 

const Navbar = ({ user, setSearchQuery }) => {
  const navigate = useNavigate();
  const { logout, getAccessTokenSilently } = useAuth0();
  const [showNotifications, setShowNotifications] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const BASE = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const API_URL = `${BASE}/api`;

  useEffect(() => {
    let subscription = null;
    if (user?.sub) {
      subscription = webSocketService.subscribe(`/topic/notifications/${user.sub}`, (data) => {
        setNotifications((prev) => [data, ...prev]);
        setHasNewNotification(true);
      });
    }
    return () => {
      if (subscription) { /* webSocketService.unsubscribe logic */ }
    };
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (localSearch.trim().length > 0) {
        setLoading(true);
        try {
          const token = await getAccessTokenSilently();
          const res = await axios.get(`${API_URL}/user/search`, {
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
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [localSearch, getAccessTokenSilently, API_URL]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    if (setSearchQuery) setSearchQuery(value);
  };

  const handleLogout = () => {
    webSocketService.disconnect();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <nav className="h-[75px] px-6 flex items-center justify-between bg-transparent w-full relative z-[200]">
      
      {/* Logo Section */}
      <div className="flex items-center gap-3 min-w-fit cursor-pointer" onClick={() => navigate('/feed')}>
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20"
        >
          <span className="text-black font-black text-lg italic tracking-tighter">OX</span>
        </motion.div>
        <h1 className="hidden md:block text-xl font-black text-white italic tracking-tighter">ONYXDRIFT</h1>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-full max-w-md mx-8 focus-within:border-cyan-400/50 transition-all">
        <FaSearch className="text-gray-500 text-sm" />
        <input
          type="text"
          value={localSearch}
          placeholder="Search creators..."
          className="bg-transparent border-none outline-none px-3 text-xs w-full text-white placeholder-gray-600"
          onChange={handleSearchChange}
          onFocus={() => localSearch.length > 0 && setShowResults(true)}
        />

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-3 w-full bg-[#0f172a]/95 border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[300] backdrop-blur-2xl"
            >
              <div className="p-4 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                <span>Neural Connects</span>
                <span className="text-cyan-400 animate-pulse font-bold">{loading ? "Scanning..." : "Live Scan"}</span>
              </div>
              <div className="max-h-[380px] overflow-y-auto no-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((d) => (
                    <div 
                      key={d._id}
                      onClick={() => {
                        navigate(`/profile/${d.auth0Id || d._id}`);
                        setShowResults(false);
                        setLocalSearch("");
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-all border-b border-white/5 last:border-none group"
                    >
                      <div className="relative">
                        <img src={d.avatar || d.picture} className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:border-cyan-500/50 transition-all" alt={d.nickname} />
                        {d.isPremium && (
                          <div className="absolute -bottom-1 -right-1 text-cyan-400 bg-[#0f172a] rounded-full p-0.5">
                            <FaCheckCircle size={10} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-black text-white uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors">{d.nickname || d.name}</p>
                        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{d.location || "Verified Drifter"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-xs text-gray-500 italic uppercase tracking-[0.2em]">No drifters found...</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 sm:gap-5 min-w-fit">
        
        {/* 💬 Messenger Button (New) */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/messages')} 
          className="p-2 text-gray-400 hover:text-cyan-400 transition-all"
        >
          <FaRegCommentDots size={20} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
                setShowNotifications(!showNotifications);
                setHasNewNotification(false); 
            }} 
            className="p-2 text-gray-400 hover:text-white transition-colors relative"
          >
            <FaBell size={18} className={showNotifications ? "text-cyan-400" : ""} />
            {hasNewNotification && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617] shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-[110]" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-64 bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-2xl z-[120] backdrop-blur-xl"
                >
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Neural Updates</p>
                  <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-3 mb-4">
                    {notifications.length > 0 ? (
                        notifications.map((notif, idx) => (
                            <div key={idx} className="text-[10px] text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                                {notif.message || "New signal received"}
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-gray-400 italic">No new signals...</div>
                    )}
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase">
                    <FaSignOutAlt /> Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar */}
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/profile/${user?.sub}`)}
          className="flex items-center gap-3 bg-white/5 p-1 pr-2 sm:pr-4 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all group shadow-inner"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-500/30">
            <img src={user?.picture || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-black text-white uppercase group-hover:text-cyan-400 transition-colors tracking-tighter">
              {user?.nickname || "Drifter"}
            </p>
          </div>
        </motion.div>
      </div>
      
      {showResults && <div className="fixed inset-0 z-[250] bg-black/20 backdrop-blur-sm" onClick={() => setShowResults(false)}></div>}
    </nav>
  );
};

export default Navbar;