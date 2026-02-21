import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaLink, FaCalendarAlt, FaEllipsisH 
} from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';
import EditProfileModal from "./EditProfileModal";
import SignalCard from "./SignalCard"; // SignalCard আলাদা ফাইলে রাখতে পারো

const ProfilePage = ({ user, isOwnProfile, userPosts, onUpdate, currentUserId, fetchMorePosts, hasMore }) => {
  const [activeTab, setActiveTab] = useState("Signals");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user?.followers?.includes(currentUserId));

  const observer = useRef();
  const tabs = ["Signals", "Replies", "Media", "Energy"];

  // Infinite Scroll Logic
  const lastPostRef = (node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchMorePosts();
    });
    if (node) observer.current.observe(node);
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-zinc-800 pb-20">
      
      {/* 🔝 Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-md p-3 flex items-center gap-6 border-b border-zinc-900">
        <FaArrowLeft className="cursor-pointer hover:bg-zinc-900 p-2 rounded-full w-9 h-9" />
        <div>
          <h2 className="text-xl font-black flex items-center gap-1">
            {user?.name} {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
            {userPosts?.length || 0} Signals
          </p>
        </div>
      </div>

      {/* 🖼 Cover & 👤 Avatar Section */}
      <div className="relative">
        <div className="h-44 md:h-52 bg-zinc-900 overflow-hidden">
          <img 
            src={user?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400"} 
            alt="cover" 
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="px-4">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-black bg-black overflow-hidden shadow-2xl relative group">
              <img src={user?.avatar || "https://via.placeholder.com/150"} alt="avatar" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex gap-2 mb-2">
              <button className="p-2 border border-zinc-800 rounded-full hover:bg-zinc-900 transition-all text-zinc-400">
                <FaEllipsisH size={14} />
              </button>
              {isOwnProfile ? (
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="border border-zinc-700 hover:bg-white/10 px-5 py-2 rounded-full font-bold text-sm transition-all"
                >
                  Edit identity
                </button>
              ) : (
                <button 
                  onClick={toggleFollow} 
                  className={`px-6 py-2 rounded-full font-black text-sm transition-all ${isFollowing ? "border border-zinc-700 text-white" : "bg-white text-black"}`}
                >
                  {isFollowing ? "Orbiting" : "Orbit"}
                </button>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3 mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-1">
                {user?.name} {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
              </h1>
              <p className="text-zinc-500 font-medium">@{user?.nickname || user?.username}</p>
            </div>
            <p className="text-[15px] leading-relaxed text-zinc-200">{user?.bio || "No bio available."}</p>
            <div className="flex flex-wrap gap-4 text-zinc-500 text-[13px] font-medium">
              <span className="flex items-center gap-1"><FaMapMarkerAlt size={12}/> {user?.location || "Neo-City"}</span>
              <span className="flex items-center gap-1 text-cyan-500"><FaLink size={12}/> {user?.website || "neural.link"}</span>
              <span className="flex items-center gap-1"><FaCalendarAlt size={12}/> Joined Feb 2026</span>
            </div>
            <div className="flex gap-5 pt-1">
              <p className="hover:underline cursor-pointer text-sm font-medium text-zinc-500">
                <span className="text-white font-black">{user?.following?.length || 0}</span> Orbiting
              </p>
              <p className="hover:underline cursor-pointer text-sm font-medium text-zinc-500">
                <span className="text-white font-black">{user?.followers?.length || 0}</span> In Orbit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📑 Tabs Section */}
      <div className="flex sticky top-[57px] bg-black/80 backdrop-blur-md z-40 border-b border-zinc-900">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-4 text-sm font-bold relative hover:bg-zinc-900/50 transition-all">
            <span className={activeTab === tab ? "text-white" : "text-zinc-500"}>{tab}</span>
            {activeTab === tab && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-cyan-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 📰 Signals Feed */}
      <div className="divide-y divide-zinc-900">
        {activeTab === "Signals" && (
          userPosts?.length > 0 ? (
            userPosts.map((post, index) => {
              if (userPosts.length === index + 1) {
                return (
                  <div ref={lastPostRef} key={post._id}>
                    <SignalCard post={post} user={user} />
                  </div>
                );
              } else {
                return <SignalCard key={post._id} post={post} user={user} />;
              }
            })
          ) : (
            <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
              Zero signals detected
            </div>
          )
        )}
      </div>

      {/* 🧬 Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onUpdate={onUpdate}
      />

    </div>
  );
};

export default ProfilePage;