import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCamera, FaLink, FaCalendarAlt, FaMapMarkerAlt, 
  FaArrowLeft, FaEllipsisH, FaTimes, FaUserEdit 
} from "react-icons/fa";
import { HiBadgeCheck } from "react-icons/hi";
import toast from "react-hot-toast";

const Profile = ({ userProfile, isOwnProfile, userPosts, onUpdate, currentUserId }) => {
  const [activeTab, setActiveTab] = useState("Echoes");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 3-dot dropdown state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(userProfile?.followers?.includes(currentUserId));
  
  // States for Real-time Image Preview
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatar || "https://via.placeholder.com/150");
  const [coverPreview, setCoverPreview] = useState(userProfile?.coverImg || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400");

  const [editData, setEditData] = useState({
    name: userProfile?.name || "",
    bio: userProfile?.bio || "",
    location: userProfile?.location || "",
    website: userProfile?.website || ""
  });

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const {
    nickname = "drifter_id",
    followers = [],
    following = [],
    isVerified = true,
    joinedDate = "Joined February 2026"
  } = userProfile || {};

  // Handle Image Selection
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      if (type === "avatar") setAvatarPreview(imageUrl);
      else setCoverPreview(imageUrl);
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover'} updated locally!`);
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Unfollowed Node" : "Linked to Node ⚡");
  };

  const handleSaveProfile = () => {
    onUpdate({ ...editData, avatar: avatarPreview, coverImg: coverPreview });
    setIsEditModalOpen(false);
    toast.success("Identity Reshaped! 🧬");
  };

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans border-x border-white/10 max-w-2xl mx-auto pb-20">
      
      {/* --- 1. Top Navigation Bar --- */}
      <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-md px-4 py-1 flex items-center gap-8 border-b border-white/5">
        <button className="p-2 hover:bg-white/10 rounded-full transition-all">
          <FaArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-1">
            {userProfile?.name || editData.name} {isVerified && <HiBadgeCheck className="text-cyan-400" />}
          </h2>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
            {userPosts?.length || 0} Echoes
          </p>
        </div>
      </div>

      {/* --- 2. Header Section --- */}
      <div className="relative">
        <div className="h-48 md:h-52 bg-zinc-900 overflow-hidden relative">
          <img src={coverPreview} className="w-full h-full object-cover" alt="Cover" />
        </div>

        <div className="px-4 relative">
          <div className="absolute -top-16 left-4">
            <div className="w-32 h-32 rounded-full border-4 border-black bg-black overflow-hidden relative shadow-2xl">
              <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" />
            </div>
          </div>

          {/* Buttons & 3-Dot Menu */}
          <div className="flex justify-end items-center gap-3 py-3 h-16 relative">
            
            {/* ৩-ডট আইকন (সব সময় থাকবে) */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 border border-white/20 rounded-full hover:bg-white/5 transition-all text-zinc-400"
              >
                <FaEllipsisH size={16} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-black border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden"
                  >
                    <button className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-sm font-bold border-b border-white/5">
                      <FaLink /> Copy Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* বাটন কন্ডিশন: নিজের প্রোফাইল হলে Edit বাটন, অন্যের প্রোফাইল হলে Follow/Unfollow বাটন */}
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="border border-zinc-600 px-5 py-1.5 rounded-full font-bold text-sm hover:bg-white/10 transition-all"
              >
                Edit profile
              </button>
            ) : (
              <button 
                onClick={handleFollowToggle}
                className={`px-6 py-1.5 rounded-full font-black text-sm transition-all ${
                  isFollowing ? "border border-zinc-600" : "bg-white text-black"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-1">
              {userProfile?.name || editData.name} {isVerified && <HiBadgeCheck className="text-cyan-400" />}
            </h1>
            <p className="text-zinc-500 font-medium">@{nickname}</p>
          </div>

          <div className="mt-3 text-[15px] leading-relaxed text-zinc-200">{userProfile?.bio || editData.bio}</div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-zinc-500 text-[14px]">
            <span className="flex items-center gap-1"><FaMapMarkerAlt size={12}/> {userProfile?.location || editData.location}</span>
            <span className="flex items-center gap-1"><FaCalendarAlt size={12}/> {joinedDate}</span>
          </div>

          <div className="flex gap-5 mt-4 pb-4 border-b border-white/5">
            <div className="flex gap-1 text-sm"><span className="font-bold text-white">{following.length}</span> <span className="text-zinc-500">Following</span></div>
            <div className="flex gap-1 text-sm"><span className="font-bold text-white">{followers.length}</span> <span className="text-zinc-500">Followers</span></div>
          </div>
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="flex sticky top-[53px] bg-black/80 backdrop-blur-md z-40">
        {["Echoes", "Replies", "Likes"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-4 text-sm font-bold relative">
            <span className={activeTab === tab ? "text-white" : "text-zinc-500"}>{tab}</span>
            {activeTab === tab && <motion.div layoutId="activeXTab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-cyan-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* --- Edit Profile Modal --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-black w-full max-w-lg rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-6">
                  <FaTimes className="cursor-pointer" onClick={() => setIsEditModalOpen(false)} />
                  <h3 className="text-lg font-bold">Edit Profile</h3>
                </div>
                <button onClick={handleSaveProfile} className="bg-white text-black px-4 py-1 rounded-full font-bold text-sm">Save</button>
              </div>

              {/* Image Editors */}
              <div className="relative h-48 bg-zinc-800">
                <img src={coverPreview} className="w-full h-full object-cover opacity-50" />
                <button onClick={() => coverInputRef.current.click()} className="absolute inset-0 m-auto w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-all">
                  <FaCamera />
                </button>
                <div className="absolute -bottom-12 left-4 w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-black">
                   <img src={avatarPreview} className="w-full h-full object-cover opacity-50" />
                   <button onClick={() => avatarInputRef.current.click()} className="absolute inset-0 m-auto w-8 h-8 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 transition-all">
                    <FaCamera size={14} />
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="p-4 pt-16 space-y-4">
                <div className="border border-white/20 rounded-md p-2 focus-within:border-cyan-500">
                  <label className="text-xs text-zinc-500 block">Name</label>
                  <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="bg-transparent w-full outline-none pt-1" />
                </div>
                <div className="border border-white/20 rounded-md p-2 focus-within:border-cyan-500">
                  <label className="text-xs text-zinc-500 block">Bio</label>
                  <textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} className="bg-transparent w-full outline-none pt-1 h-20 resize-none" />
                </div>
              </div>

              {/* Hidden Inputs */}
              <input type="file" ref={coverInputRef} hidden onChange={(e) => handleImageUpload(e, "cover")} />
              <input type="file" ref={avatarInputRef} hidden onChange={(e) => handleImageUpload(e, "avatar")} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;