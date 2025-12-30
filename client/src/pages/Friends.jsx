import React, { useState } from "react";
import { 
  FaUserPlus, FaEllipsisH, FaSearch, FaUserFriends, 
  FaUserCheck, FaUserTimes, FaGift, FaChevronRight 
} from "react-icons/fa";
import { MdOutlinePeopleAlt, MdPersonAddAlt1, MdOutlinePersonSearch } from "react-icons/md";

const Friends = () => {
  const [activeTab, setActiveTab] = useState("all");

  // ডামি ফ্রেন্ড লিস্ট
  const friendsList = [
    { id: 1, name: "Arif Ahmed", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arif", mutual: 12, status: "friend" },
    { id: 2, name: "Sumaiya Khan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sumaiya", mutual: 5, status: "request" },
    { id: 3, name: "Rakib Hasan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakib", mutual: 21, status: "suggestion" },
    { id: 4, name: "Nusrat Jahan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nusrat", mutual: 8, status: "friend" },
  ];
const sendFriendRequest = async (targetUserId) => {
  try {
    // ১. ডাটাবেসে সেভ করা
    await axios.post("http://localhost:10000/api/friend-request", {
      senderId: user.sub,
      receiverId: targetUserId
    });

    // ২. রিয়েল টাইম নোটিফিকেশন পাঠানো
    socket.current.emit("sendNotification", {
      receiverId: targetUserId,
      data: {
        from: user.name,
        type: "friend_request",
        image: user.picture
      }
    });

    alert("Request Sent!");
  } catch (err) {
    console.error(err);
  }
};
  return (
    <div className="flex bg-[#050505] min-h-screen text-[#e4e6eb]">
      
      {/* ১. বাম পাশের ফেসবুক স্টাইল সাইডবার */}
      <div className="hidden lg:flex w-[360px] bg-[#1c1c1c] sticky top-[80px] h-[calc(100vh-80px)] flex-col p-4 border-r border-white/5">
        <div className="flex justify-between items-center px-2 mb-6">
          <h1 className="text-2xl font-black text-white">Friends</h1>
          <div className="p-2 bg-white/5 rounded-full cursor-pointer hover:bg-white/10">
            <FaSearch />
          </div>
        </div>

        <div className="space-y-1">
          <SidebarItem icon={<FaUserFriends />} title="Home" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
          <SidebarItem icon={<MdPersonAddAlt1 />} title="Friend Requests" onClick={() => setActiveTab("requests")} />
          <SidebarItem icon={<MdOutlinePersonSearch />} title="Suggestions" onClick={() => setActiveTab("suggestions")} />
          <SidebarItem icon={<FaUserCheck />} title="All Friends" onClick={() => setActiveTab("friends")} />
          <SidebarItem icon={<FaGift />} title="Birthdays" />
          <SidebarItem icon={<FaUserCheck />} title="Custom Lists" rightIcon={<FaChevronRight />} />
        </div>
      </div>

      {/* ২. মেইন কন্টেন্ট এরিয়া */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* রিকোয়েস্ট সেকশন (ফেসবুকে এটি উপরে থাকে) */}
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-xl font-black">Friend Requests</h2>
            <button className="text-blue-500 font-bold hover:bg-blue-500/10 px-4 py-2 rounded-lg transition">See All</button>
          </div>

          {/* ফ্রেন্ড রিকোয়েস্ট কার্ডস (Vertical/Horizontal Mixed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
            {friendsList.filter(f => f.status === "request").map(friend => (
              <FriendCard key={friend.id} friend={friend} type="request" />
            ))}
          </div>

          {/* সাজেশন সেকশন */}
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-xl font-black">People You May Know</h2>
            <button className="text-blue-500 font-bold hover:bg-blue-500/10 px-4 py-2 rounded-lg transition">See All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {friendsList.filter(f => f.status !== "request").map(friend => (
              <FriendCard key={friend.id} friend={friend} type="suggestion" />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

// --- সাব-কম্পোনেন্ট: সাইডবার আইটেম ---
const SidebarItem = ({ icon, title, active, onClick, rightIcon }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${active ? "bg-blue-500/10 text-blue-500" : "hover:bg-white/5 text-gray-300"}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2.5 rounded-full ${active ? "bg-blue-500 text-white" : "bg-white/10 text-white"}`}>
        {icon}
      </div>
      <span className="font-bold text-[15px]">{title}</span>
    </div>
    {rightIcon && <div className="text-gray-500 text-xs">{rightIcon}</div>}
  </div>
);

// --- সাব-কম্পোনেন্ট: ফ্রেন্ড কার্ড (Facebook Style) ---
const FriendCard = ({ friend, type }) => (
  <div className="bg-[#1c1c1c] border border-white/5 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
    <div className="aspect-square overflow-hidden bg-gray-800">
      <img 
        src={friend.img} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        alt={friend.name} 
      />
    </div>
    
    <div className="p-3 space-y-3">
      <div>
        <h3 className="font-bold text-[15px] truncate">{friend.name}</h3>
        <p className="text-gray-500 text-xs font-medium">{friend.mutual} mutual friends</p>
      </div>

      <div className="flex flex-col gap-2">
        {type === "request" ? (
          <>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition active:scale-95">
              Confirm
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold text-sm transition active:scale-95">
              Delete
            </button>
          </>
        ) : (
          <>
            <button className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95">
              <FaUserPlus /> Add Friend
            </button>
            <button className="w-full bg-white/5 hover:bg-white/10 text-gray-400 py-2 rounded-lg font-bold text-sm transition active:scale-95">
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

export default Friends;