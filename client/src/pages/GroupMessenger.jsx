import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineUserGroup, 
  HiOutlinePlusCircle, 
  HiArrowSmallRight, 
  HiOutlinePhone, 
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

const GroupMessenger = ({ socket, API_URL, getAuthToken, onSelectGroup }) => {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("Neural Network Error:", err); 
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthToken]);

  useEffect(() => {
    fetchGroups();

    // Listen for real-time group updates
    const s = socket?.current || socket;
    if (s) {
      s.on("newGroupCreated", fetchGroups);
      return () => s.off("newGroupCreated");
    }
  }, [fetchGroups, socket]);

  const createGroup = async () => {
    if (!groupName.trim() || groupName.length < 3) return;
    try {
      const token = await getAuthToken();
      const res = await axios.post(`${API_URL}/api/groups/create`, { name: groupName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Notify others via socket
      const s = socket?.current || socket;
      if (s) s.emit("broadcastNewGroup", res.data);

      setGroupName("");
      setShowCreate(false);
      fetchGroups();
    } catch (err) { 
      console.error("Group initialization failed", err); 
    }
  };

  const handleJoinCall = (e, group) => {
    e.stopPropagation();
    const s = socket?.current || socket;
    if (s) {
      s.emit("joinGroupCall", { groupId: group._id });
      // SPA Navigation (No refresh)
      navigate(`/call/group/${group._id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-2">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black italic tracking-tighter text-white">NEURAL HIVES</h2>
          <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">Encrypted Multi-Link Protocol</p>
        </div>
        <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75"></div>
        </div>
      </div>

      {/* Create Group Trigger */}
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowCreate(!showCreate)}
        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
          showCreate ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 border-white/10 text-cyan-400 hover:bg-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <HiOutlinePlusCircle size={24} className={showCreate ? "animate-spin-slow" : ""} />
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            {showCreate ? 'Establish Connection...' : 'Construct New Hive'}
          </span>
        </div>
        <HiArrowSmallRight className={showCreate ? "rotate-90 transition-transform" : ""} />
      </motion.button>

      {/* Animated Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-3xl space-y-4 backdrop-blur-xl"
          >
            <input 
              autoFocus
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Hive Designation (e.g. ALPHA SQUAD)"
              className="w-full bg-black/60 border border-white/10 p-4 rounded-2xl outline-none text-sm focus:border-cyan-500/50 text-white placeholder:text-zinc-600 transition-all shadow-inner"
            />
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-colors"
                >
                    Abort
                </button>
                <button 
                    onClick={createGroup} 
                    className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                    Initialize Hive
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group List with Skeleton */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 w-full bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))
        ) : groups.length > 0 ? (
          groups.map((g, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={g._id} 
              onClick={() => onSelectGroup && onSelectGroup(g)}
              className="group relative p-4 flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl hover:border-cyan-500/40 transition-all cursor-pointer overflow-hidden"
            >
              {/* Animated Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              {/* Group Avatar Area */}
              <div className="relative">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-cyan-400 border border-white/10 group-hover:border-cyan-500/50 transition-all shadow-xl">
                  <HiOutlineUserGroup size={28} />
                </div>
                {/* Online Indicator for Group Call */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#020617] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-white truncate">{g.name}</h4>
                    <HiOutlineShieldCheck className="text-cyan-500/50" size={12} />
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-tighter">
                        {g.members?.length || 0} Drifters
                    </p>
                    <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <p className="text-[9px] text-cyan-600 font-mono uppercase italic font-bold">Encrypted Link</p>
                </div>
              </div>

              {/* Pro Action Buttons */}
              <div className="flex items-center gap-1 z-10">
                <motion.button 
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(6, 182, 212, 0.2)' }}
                  onClick={(e) => handleJoinCall(e, g)}
                  className="p-3 bg-white/5 text-zinc-400 hover:text-cyan-400 rounded-xl transition-all border border-transparent hover:border-cyan-500/30"
                >
                  <HiOutlinePhone size={20} />
                </motion.button>
                <div className="p-3 text-zinc-500 opacity-20 hover:opacity-100 transition-opacity">
                   <HiOutlineChatBubbleLeftRight size={20} className="group-hover:text-cyan-400" />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center space-y-4 rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
            <HiOutlineUserGroup size={48} className="mx-auto text-zinc-800" />
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">No Hives Detected</p>
                <p className="text-[9px] text-zinc-700 font-mono">Initialization required to start neural link</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMessenger;