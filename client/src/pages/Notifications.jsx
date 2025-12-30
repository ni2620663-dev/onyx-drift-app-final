import React, { useState, useEffect } from "react"; // ✅ useEffect যোগ করা হয়েছে
import { FaEllipsisH, FaCheck, FaTrash, FaBirthdayCake, FaComment, FaUserPlus, FaHistory } from "react-icons/fa";
import { toast } from 'react-toastify';

const Notifications = ({ socket }) => { // ✅ Props হিসেবে socket গ্রহণ করা হয়েছে
  const [notifs, setNotifs] = useState([
    { id: 1, user: "Nusrat Akatar", action: "added to their story.", time: "41m", active: true, type: 'story', img: "https://i.pravatar.cc/150?u=1" },
    { id: 2, user: "Ahmed Siam", action: "highlighted a comment for you.", time: "1h", active: true, type: 'comment', img: "https://i.pravatar.cc/150?u=2" },
    { id: 3, user: "Misti Chele", action: "has a birthday today.", time: "10h", active: false, type: 'birthday', img: "https://i.pravatar.cc/150?u=3" },
    { id: 4, user: "Sabbir Hossain", action: "sent you a friend request.", time: "2d", active: false, type: 'friend', img: "https://i.pravatar.cc/150?u=4" },
  ]);

  const [activeMenu, setActiveMenu] = useState(null);

  // সকেট থেকে নোটিফিকেশন রিসিভ করা
  useEffect(() => {
    if (!socket?.current) return;

    socket.current.on("getNotification", (data) => {
      console.log("New Notif:", data);
      
      // নতুন নোটিফিকেশন অবজেক্ট তৈরি
      const newNotif = {
        id: Date.now(),
        user: data.senderName,
        action: data.type === 'friend_request' ? "sent you a friend request." : "interacted with you.",
        time: "Just now",
        active: true,
        type: data.type === 'friend_request' ? 'friend' : 'default',
        img: data.image || "https://i.pravatar.cc/150"
      };

      // স্টেট আপডেট
      setNotifs(prev => [newNotif, ...prev]);
      
      // টোস্ট পপআপ
      toast.info(`🔔 ${data.senderName} ${newNotif.action}`);
    });

    return () => socket.current.off("getNotification");
  }, [socket]);

  // নোটিফিকেশন পড়া হয়েছে হিসেবে মার্ক করা
  const markAsRead = (id) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, active: false } : n));
    setActiveMenu(null);
  };

  // নোটিফিকেশন ডিলিট করা
  const removeNotif = (id) => {
    setNotifs(notifs.filter(n => n.id !== id));
    setActiveMenu(null);
  };

  // টাইপ অনুযায়ী আইকন সেট করা
  const getIcon = (type) => {
    switch (type) {
      case 'birthday': return <div className="absolute bottom-0 right-0 bg-pink-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c]"><FaBirthdayCake /></div>;
      case 'comment': return <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c]"><FaComment /></div>;
      case 'friend': return <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c]"><FaUserPlus /></div>;
      default: return <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full text-[10px] text-white border-2 border-[#1c1c1c]"><FaHistory /></div>;
    }
  };

  return (
    <div className="max-w-[650px] mx-auto pt-20 pb-10 px-4">
      <div className="bg-[#1c1c1c] rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
          <button className="text-blue-500 text-sm font-bold hover:bg-blue-500/10 px-3 py-1 rounded-lg transition">
            See all
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 mb-4">
          <button className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-full text-sm font-black">All</button>
          <button className="text-gray-400 hover:bg-white/5 px-4 py-1.5 rounded-full text-sm font-bold transition">Unread</button>
        </div>

        {/* Notifications List */}
        <div className="pb-4">
          <p className="px-6 text-sm font-black text-gray-500 mb-2 uppercase tracking-widest">New</p>
          
          <div className="space-y-0.5">
            {notifs.map(n => (
              <div 
                key={n.id} 
                className={`relative flex items-center gap-4 px-6 py-4 cursor-pointer transition-all group ${n.active ? "bg-blue-600/5 hover:bg-blue-600/10" : "hover:bg-white/5"}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={n.img} className="w-14 h-14 rounded-full border border-white/10 object-cover" alt="" />
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 pr-8" onClick={() => markAsRead(n.id)}>
                  <p className={`text-[15px] leading-tight ${n.active ? "text-white" : "text-gray-400"}`}>
                    <span className="font-black text-white hover:underline">{n.user}</span> {n.action}
                  </p>
                  <span className={`text-xs mt-1 inline-block font-bold ${n.active ? "text-blue-500" : "text-gray-500"}`}>
                    {n.time}
                  </span>
                </div>

                {n.active && <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}

                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === n.id ? null : n.id);
                    }}
                    className="p-3 rounded-full hover:bg-white/10 text-gray-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    <FaEllipsisH />
                  </button>

                  {activeMenu === n.id && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#242526] border border-white/10 rounded-xl shadow-2xl z-50 p-2">
                      <button onClick={() => markAsRead(n.id)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-sm text-gray-200 font-bold">
                        <FaCheck className="text-blue-500" /> Mark as read
                      </button>
                      <button onClick={() => removeNotif(n.id)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-sm text-red-500 font-bold">
                        <FaTrash /> Remove notification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {notifs.length === 0 && (
          <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
            No notifications yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;