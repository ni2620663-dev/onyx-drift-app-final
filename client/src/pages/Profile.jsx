import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaLink, FaCalendarAlt, FaEllipsisH 
} from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';
import EditProfileModal from "./EditProfileModal";
import SignalCard from "./SignalCard";

const ProfilePage = ({ user, isOwnProfile, userPosts, onUpdate, currentUserId, fetchMorePosts, hasMore }) => {
  const [activeTab, setActiveTab] = useState("Signals");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Sync following state when user data loads
  useEffect(() => {
    if (user?.followers && currentUserId) {
      setIsFollowing(user.followers.includes(currentUserId));
    }
  }, [user, currentUserId]);

  const observer = useRef();
  const tabs = ["Signals", "Replies", "Media", "Energy"];

  // Default Images (Placeholder fallback)
  const defaultBanner = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=06b6d4&color=fff`;

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
    // Note: Here you'd typically call an API to update the backend
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-zinc-800 pb-20">
      
      {/* 🔝 Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-md p-3 flex items-center gap-6 border-b border-zinc-900">
        <button onClick={() => window.history.back()} className="hover:bg-zinc-900 p-2 rounded-full transition-all">
          <FaArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-black flex items-center gap-1">
            {user?.name || "Neural Drifter"} {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
            {userPosts?.length || 0} Signals
          </p>
        </div>
      </div>

      {/* 🖼 Cover & 👤 Avatar Section */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-44 md:h-52 bg-zinc-900 overflow-hidden">
          <img 
            src={user?.coverImg || defaultBanner} 
            alt="cover" 
            className="w-full h-full object-cover" 
            onError={(e) => { e.target.src = defaultBanner }}
          />
        </div>

        {/* Profile Info Overlay */}
        <div className="px-4">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-black bg-black overflow-hidden shadow-2xl relative">
              <img 
                src={user?.avatar || user?.picture || defaultAvatar} 
                alt="avatar" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = defaultAvatar }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mb-2">
              <button className="p-2 border border-zinc-800 rounded-full hover:bg-zinc-900 transition-all text-zinc-400">
                <FaEllipsisH size={14} />
              </button>
              
              {/* Conditional Rendering for Edit/Follow Button */}
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
                  className={`px-6 py-2 rounded-full font-black text-sm transition-all shadow-lg ${isFollowing ? "border border-zinc-700 text-white" : "bg-white text-black hover:bg-zinc-200"}`}
                >
                  {isFollowing ? "Orbiting" : "Orbit"}
                </button>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3 mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-1 text-white">
                {user?.name || "Drifter"} {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
              </h1>
              <p className="text-zinc-500 font-medium">@{user?.nickname || user?.username || "identity_unknown"}</p>
            </div>
            
            <p className="text-[15px] leading-relaxed text-zinc-200">
              {user?.bio || "No bio available. System awaiting neural input..."}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500 text-[13px] font-medium">
              <span className="flex items-center gap-1"><FaMapMarkerAlt size={12}/> {user?.location || "Neo-City"}</span>
              <span className="flex items-center gap-1 text-cyan-500">
                <FaLink size={12}/> 
                <a 
                  href={user?.website?.startsWith('http') ? user.website : `https://${user?.website || ''}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:underline"
                >
                  {user?.website || "neural.link"}
                </a>
              </span>
              <span className="flex items-center gap-1"><FaCalendarAlt size={12}/> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Feb 2026"}</span>
            </div>

            <div className="flex gap-5 pt-1">
              <p className="hover:underline cursor-pointer text-sm font-medium text-zinc-400">
                <span className="text-white font-black">{user?.following?.length || 0}</span> Orbiting
              </p>
              <p className="hover:underline cursor-pointer text-sm font-medium text-zinc-400">
                <span className="text-white font-black">{user?.followers?.length || 0}</span> In Orbit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📑 Tabs Section */}
      <div className="flex sticky top-[57px] bg-black/80 backdrop-blur-md z-40 border-b border-zinc-900">
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className="flex-1 py-4 text-sm font-bold relative hover:bg-zinc-900/50 transition-all"
          >
            <span className={activeTab === tab ? "text-white" : "text-zinc-500"}>{tab}</span>
            {activeTab === tab && (
              <motion.div 
                layoutId="tab" 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-cyan-500 rounded-full" 
              />
            )}
          </button>
        ))}
      </div>

      {/* 📰 Signals Feed */}
      <div className="divide-y divide-zinc-900 min-h-[400px]">
        {activeTab === "Signals" && (
          userPosts?.length > 0 ? (
            userPosts.map((post, index) => {
              const isLastElement = userPosts.length === index + 1;
              return (
                <div ref={isLastElement ? lastPostRef : null} key={post._id || index}>
                  <SignalCard post={post} user={user} />
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center">
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
                Zero signals detected in this sector
              </p>
            </div>
          )
        )}
        
        {/* Other tabs placeholder */}
        {activeTab !== "Signals" && (
          <div className="py-24 text-center text-zinc-700 text-xs font-bold uppercase tracking-widest">
            {activeTab} module offline
          </div>
        )}
      </div>

      {/* 🧬 Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onUpdate={onUpdate}
        />
      )}

    </div>
  );
};

export default ProfilePage;