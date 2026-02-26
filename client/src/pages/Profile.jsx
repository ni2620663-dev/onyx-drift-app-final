import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // ১. আইডি স্যানিটাইজেশন
  const sanitizeId = (id) => id ? decodeURIComponent(id).trim() : null;
  const decodedCurrentId = sanitizeId(currentUserId);
  const decodedProfileId = sanitizeId(user?.auth0Id);
  const isReallyMe = isOwnProfile || (decodedCurrentId && decodedProfileId && decodedCurrentId === decodedProfileId);

  // ২. ফলোয়িং স্টেট সিঙ্ক
  useEffect(() => {
    if (user?.followers && decodedCurrentId) {
      const followingStatus = user.followers.some(fId => sanitizeId(fId) === decodedCurrentId);
      setIsFollowing(followingStatus);
    }
  }, [user, decodedCurrentId]);

  const observer = useRef();
  const tabs = ["Signals", "Replies", "Media", "Energy"];

  // ৩. ডিফল্ট ইমেজ হ্যান্ডলার
  const defaultBanner = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070";
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'Drifter'}`;

  // ৪. ইনফিনিট স্ক্রল লজিক
  const lastPostRef = (node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchMorePosts();
    });
    if (node) observer.current.observe(node);
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Connect with your Follow/Unfollow API
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="text-cyan-500 animate-pulse tracking-[0.5em] text-xs uppercase">
          Fetching Neural Identity...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-zinc-800 pb-20 font-mono selection:bg-cyan-500/30">
      
      {/* 🔝 Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-md p-3 flex items-center gap-6 border-b border-zinc-900">
        <button 
          onClick={() => window.history.back()} 
          className="hover:bg-zinc-900 p-2 rounded-full transition-all group"
        >
          <FaArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-xl font-black flex items-center gap-1 tracking-tighter truncate max-w-[200px]">
            {user?.name || "Neural Drifter"} 
            {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
            {userPosts?.length || 0} Signals Detected
          </p>
        </div>
      </div>

      {/* 🖼 Cover & Avatar Section */}
      <div className="relative">
        <div className="h-44 md:h-52 bg-zinc-900 overflow-hidden relative group">
          <img 
            src={user?.coverImg || defaultBanner} 
            alt="cover" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => { e.target.src = defaultBanner }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="px-4">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            {/* Profile Avatar */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black bg-black overflow-hidden shadow-2xl relative z-10 group">
              <img 
                src={user?.avatar || user?.picture || defaultAvatar} 
                alt="avatar" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => { e.target.src = defaultAvatar }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mb-2 relative z-10">
              <button className="p-2 border border-zinc-800 rounded-full hover:bg-zinc-900 transition-all text-zinc-400">
                <FaEllipsisH size={14} />
              </button>
              
              {isReallyMe ? (
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="border border-zinc-700 hover:bg-white text-white hover:text-black px-5 py-2 rounded-full font-bold text-sm transition-all duration-300"
                >
                  Edit identity
                </button>
              ) : (
                <button 
                  onClick={toggleFollow} 
                  className={`px-6 py-2 rounded-full font-black text-sm transition-all shadow-lg ${
                    isFollowing 
                    ? "border border-zinc-700 text-white hover:border-red-500/50 hover:text-red-500" 
                    : "bg-white text-black hover:bg-cyan-400"
                  }`}
                >
                  {isFollowing ? "Orbiting" : "Orbit"}
                </button>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3 mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-1 text-white uppercase italic">
                {user?.name || "Drifter"} 
                {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
              </h1>
              <p className="text-zinc-500 font-medium lowercase">@{user?.nickname || user?.username || "identity_unknown"}</p>
            </div>
            
            <p className="text-[15px] leading-relaxed text-zinc-300 max-w-xl">
              {user?.bio || "No bio available. System awaiting neural input..."}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1"><FaMapMarkerAlt size={12} className="text-zinc-700"/> {user?.location || "Neo-City"}</span>
              <span className="flex items-center gap-1 text-cyan-500/80">
                <FaLink size={12}/> 
                <a 
                  href={user?.website?.startsWith('http') ? user.website : `https://${user?.website || ''}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:underline hover:text-cyan-400"
                >
                  {user?.website || "neural.link"}
                </a>
              </span>
              <span className="flex items-center gap-1"><FaCalendarAlt size={12} className="text-zinc-700"/> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Feb 2026"}</span>
            </div>

            <div className="flex gap-5 pt-1 border-t border-zinc-900 mt-4 w-fit">
              <p className="hover:underline cursor-pointer text-sm font-medium text-zinc-400 group">
                <span className="text-white font-black group-hover:text-cyan-400 transition-colors">{user?.following?.length || 0}</span> Orbiting
              </p>
              <p className="hover:underline cursor-pointer text-sm font-medium text-zinc-400 group">
                <span className="text-white font-black group-hover:text-cyan-400 transition-colors">{user?.followers?.length || 0}</span> In Orbit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📑 Tabs Section */}
      <div className="flex sticky top-[57px] bg-black/80 backdrop-blur-md z-40 border-b border-zinc-900 mt-2">
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className="flex-1 py-4 text-xs font-black uppercase tracking-widest relative hover:bg-zinc-900/50 transition-all"
          >
            <span className={activeTab === tab ? "text-cyan-400" : "text-zinc-600"}>{tab}</span>
            {activeTab === tab && (
              <motion.div 
                layoutId="tab-underline" 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-cyan-400 shadow-[0_0_10px_#06b6d4]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* 📰 Signals Feed */}
      <div className="divide-y divide-zinc-900 min-h-[400px]">
        {activeTab === "Signals" ? (
          userPosts?.length > 0 ? (
            userPosts.map((post, index) => (
              <div 
                ref={userPosts.length === index + 1 ? lastPostRef : null} 
                key={post._id || index}
              >
                <SignalCard post={post} user={user} />
              </div>
            ))
          ) : (
            <div className="py-24 text-center">
              <p className="text-zinc-700 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
                Zero signals detected in this sector
              </p>
            </div>
          )
        ) : (
          <div className="py-24 text-center text-zinc-800 text-[10px] font-black uppercase tracking-[0.6em]">
            {activeTab} module offline
          </div>
        )}
      </div>

      {/* 🧬 Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;