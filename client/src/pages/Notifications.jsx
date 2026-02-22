import React, { useState, useEffect } from "react";
import { FaEllipsisH, FaCheck, FaTrash, FaBirthdayCake, FaComment, FaUserPlus, FaHistory } from "react-icons/fa";
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion"; // এনিমেশনের জন্য যোগ করা হয়েছে

const Notifications = ({ socket }) => {
  const [notifs, setNotifs] = useState([
    { id: 1, user: "Nusrat Akatar", action: "added to their story.", time: "41m", active: true, type: 'story', img: "https://i.pravatar.cc/150?u=1" },
    { id: 2, user: "Ahmed Siam", action: "highlighted a comment for you.", time: "1h", active: true, type: 'comment', img: "https://i.pravatar.cc/150?u=2" },
    { id: 3, user: "Misti Chele", action: "has a birthday today.", time: "10h", active: false, type: 'birthday', img: "https://i.pravatar.cc/150?u=3" },
    { id: 4, user: "Sabbir Hossain", action: "sent you a friend request.", time: "2d", active: false, type: 'friend', img: "https://i.pravatar.cc/150?u=4" },
  ]);

  const [activeMenu, setActiveMenu] = useState(null);
  const [showEdgeGlow, setShowEdgeGlow] = useState(false); // ✅ Edge Glow State

  // সকেট থেকে নোটিফিকেশন রিসিভ করা
  useEffect(() => {
    const s = socket?.current || socket; // প্রপস হ্যান্ডলিং ফিক্স
    if (!s) return;

    s.on("getNotification", (data) => {
      console.log("New Signal:", data);
      
      const newNotif = {
        id: Date.now(),
        user: data.senderName,
        action: data.type === 'friend_request' ? "sent you a friend request." : "interacted with you.",
        time: "Just now",
        active: true,
        type: data.type === 'friend_request' ? 'friend' : 'default',
        img: data.image || `https://ui-avatars.com/api/?name=${data.senderName}&background=random`
      };

      setNotifs(prev => [newNotif, ...prev]);
      
      // ✅ Trigger Edge Glow Effect
      setShowEdgeGlow(true);
      setTimeout(() => setShowEdgeGlow(false), 3000); // ৩ সেকেন্ড পর গ্লো চলে যাবে

      // টোস্ট পপআপ
      toast.info(`🔔 ${data.senderName} ${newNotif.action}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    });

    return () => s.off("getNotification");
  }, [socket]);

  const markAsRead = (id) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, active: false } : n));
    setActiveMenu(null);
  };

  const removeNotif = (id) => {
    setNotifs(notifs.filter(n => n.id !== id));
    setActiveMenu(null);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'birthday': return <div className="absolute bottom-0 right-0 bg-pink-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c] shadow-[0_0_5px_#ec4899]"><FaBirthdayCake /></div>;
      case 'comment': return <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c] shadow-[0_0_5px_#22c55e]"><FaComment /></div>;
      case 'friend': return <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c] shadow-[0_0_5px_#3b82f6]"><FaUserPlus /></div>;
      default: return <div className="absolute bottom-0 right-0 bg-cyan-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c] shadow-[0_0_5px_#06b6d4]"><FaHistory /></div>;
    }
  };

  return (
    <>
      {/* 🌌 EDGE GLOW NOTIFICATION LAYER */}
      <AnimatePresence>
        {showEdgeGlow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] pointer-events-none border-[6px] border-cyan-500 shadow-[inset_0_0_30px_#06b6d4,0_0_30px_#06b6d4]"
          />
        )}
      </AnimatePresence>

      <div className="max-w-[650px] mx-auto pt-20 pb-10 px-4 min-h-screen">
        <div className="bg-[#111111]/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden transition-all duration-500">
          
          {/* Header */}
          <div className="flex items-center justify-between p-7 bg-gradient-to-b from-white/5 to-transparent">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase">Neural Log</h1>
              <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Encryption: Active</p>
            </div>
            <button className="bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-widest border border-cyan-500/20 px-4 py-2 rounded-full hover:bg-cyan-500 hover:text-black transition-all">
              Clear Buffer
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 px-7 mb-2">
            <button className="border-b-2 border-cyan-500 text-cyan-500 pb-2 text-xs font-black uppercase tracking-widest">Recent</button>
            <button className="text-zinc-500 pb-2 text-xs font-black uppercase tracking-widest hover:text-zinc-300 transition">Archived</button>
          </div>

          {/* Notifications List */}
          <div className="pb-6">
            <div className="space-y-1">
              {notifs.map(n => (
                <div 
                  key={n.id} 
                  className={`relative flex items-center gap-4 px-7 py-5 cursor-pointer transition-all duration-300 group ${n.active ? "bg-cyan-500/[0.03] border-l-2 border-cyan-500" : "hover:bg-white/[0.02] border-l-2 border-transparent"}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={n.img} className="w-14 h-14 rounded-2xl border border-white/10 object-cover group-hover:scale-105 transition-transform" alt="" />
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 pr-6" onClick={() => markAsRead(n.id)}>
                    <p className={`text-[14px] leading-tight ${n.active ? "text-zinc-100" : "text-zinc-500"}`}>
                      <span className="font-black text-white mr-1 group-hover:text-cyan-400 transition-colors uppercase italic">{n.user}</span> 
                      <span className="font-medium">{n.action}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <span className={`text-[9px] font-black uppercase tracking-tighter ${n.active ? "text-cyan-500" : "text-zinc-600"}`}>
                        {n.time}
                      </span>
                      {n.active && <span className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />}
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === n.id ? null : n.id);
                      }}
                      className="p-3 rounded-xl hover:bg-white/5 text-zinc-600 group-hover:text-zinc-300 transition-all"
                    >
                      <FaEllipsisH />
                    </button>

                    <AnimatePresence>
                      {activeMenu === n.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[100] p-2 backdrop-blur-2xl"
                        >
                          <button onClick={() => markAsRead(n.id)} className="w-full flex items-center gap-3 p-3 hover:bg-cyan-500/10 rounded-xl text-xs text-zinc-300 font-black uppercase tracking-widest transition-all">
                            <FaCheck className="text-cyan-500" /> Mark as read
                          </button>
                          <button onClick={() => removeNotif(n.id)} className="w-full flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-xl text-xs text-red-500 font-black uppercase tracking-widest transition-all">
                            <FaTrash /> Purge Signal
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notifs.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-block p-4 rounded-full bg-white/5 mb-4">
                <FaHistory className="text-zinc-700 text-3xl" />
              </div>
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px]">
                No active signals found in the grid
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;