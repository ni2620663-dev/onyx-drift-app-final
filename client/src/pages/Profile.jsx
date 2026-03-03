import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaCamera 
} from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';
import EditProfileModal from "./EditProfileModal";
import SignalCard from "./SignalCard";

const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const API_AUDIENCE = "https://onyx-drift-api.com";

const ProfilePage = () => {
  const { userId: profileId } = useParams(); 
  const { user: currentUser, getAccessTokenSilently } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Signals");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const tabs = ["Signals", "Replies", "Media", "Energy"];

  // প্রোফাইল ও পোস্ট ফেচ করার লজিক
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: API_AUDIENCE },
      });

      // প্রোফাইল ডেটা
      const profileRes = await axios.get(`${BACKEND_URL}/api/profile/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);

      // পোস্ট ডেটা
      const postsRes = await axios.get(`${BACKEND_URL}/api/posts/user/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPosts(postsRes.data.posts || []);

      if (profileRes.data.followers && currentUser?.sub) {
        setIsFollowing(profileRes.data.followers.includes(currentUser.sub));
      }
    } catch (err) {
      console.error("Neural Identity Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId, getAccessTokenSilently, currentUser?.sub]);

  useEffect(() => {
    if (profileId) fetchProfileData();
  }, [fetchProfileData]);

  const isReallyMe = currentUser?.sub === profileId;

  const defaultBanner = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070";
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'Drifter'}`;

  // ট্যাব অনুযায়ী ফিল্টার করা কন্টেন্ট
  const renderTabContent = () => {
    switch (activeTab) {
      case "Signals":
        return userPosts.map((post) => (
          <SignalCard key={post._id} post={post} currentUserAuth0Id={currentUser?.sub} />
        ));
      case "Media":
        const mediaPosts = userPosts.filter(p => p.image || p.video);
        return mediaPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 p-1">
            {mediaPosts.map(post => (
              <div key={post._id} className="aspect-square bg-zinc-900 border border-zinc-800 overflow-hidden relative group">
                {post.image ? (
                  <img src={post.image} className="w-full h-full object-cover" alt="media" />
                ) : (
                  <video src={post.video} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-600 text-[10px] uppercase tracking-widest">No Media Found</div>
        );
      default:
        return (
          <div className="py-20 text-center text-zinc-700 text-[10px] uppercase tracking-widest">
            {activeTab} Module Encryption Active
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-zinc-900 pb-20 font-mono">
      
      {/* 🔝 Sticky Navbar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md p-3 flex items-center gap-8 border-b border-zinc-900">
        <button onClick={() => window.history.back()} className="hover:bg-zinc-900 p-2 rounded-full transition-all">
          <FaArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-md font-black flex items-center gap-1">
            {user?.name} {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{userPosts.length} Signals</p>
        </div>
      </div>

      {/* 🖼 Header Images */}
      <div className="relative group">
        <div className="h-40 md:h-48 bg-zinc-900 overflow-hidden relative">
          <img 
            src={user?.coverImg || defaultBanner} 
            className="w-full h-full object-cover opacity-80" 
            alt="cover" 
          />
          {isReallyMe && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
               <button onClick={() => setIsEditModalOpen(true)} className="bg-black/60 p-3 rounded-full border border-white/20"><FaCamera /></button>
            </div>
          )}
        </div>

        <div className="px-4 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black bg-black overflow-hidden relative z-10">
              <img 
                src={user?.avatar || user?.picture || defaultAvatar} 
                className="w-full h-full object-cover rounded-full" 
                alt="avatar" 
              />
              {isReallyMe && (
                <div onClick={() => setIsEditModalOpen(true)} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                  <FaCamera className="text-white" />
                </div>
              )}
            </div>
            
            <div className="mb-2">
              {isReallyMe ? (
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="border border-zinc-700 hover:bg-white hover:text-black px-5 py-2 rounded-full font-bold text-xs transition-all"
                >
                  Edit Identity
                </button>
              ) : (
                <button className="bg-white text-black px-6 py-2 rounded-full font-black text-xs hover:bg-cyan-400 transition-all">
                  {isFollowing ? "Linked" : "Link Neural"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h1 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-1">
              {user?.name} {user?.isVerified && <HiBadgeCheck className="text-cyan-400" />}
            </h1>
            <p className="text-zinc-500 text-sm">@{user?.nickname || "drifter"}</p>
            <p className="text-[15px] text-zinc-200 pt-2 leading-relaxed">{user?.bio || "No neural bio set."}</p>
            
            <div className="flex gap-4 text-[11px] font-bold text-zinc-500 uppercase pt-3">
              <span className="flex items-center gap-1"><FaMapMarkerAlt /> {user?.location || "Neo-City"}</span>
              <span className="flex items-center gap-1"><FaCalendarAlt /> Joined {new Date(user?.createdAt).toLocaleDateString('en-US', {month:'short', year:'numeric'})}</span>
            </div>

            <div className="flex gap-5 pt-4">
              <p className="text-sm"><span className="font-black text-white">{user?.following?.length || 0}</span> <span className="text-zinc-500">Following</span></p>
              <p className="text-sm"><span className="font-black text-white">{user?.followers?.length || 0}</span> <span className="text-zinc-500">Followers</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 📑 Tab Navigation */}
      <div className="flex sticky top-[61px] bg-black/80 backdrop-blur-md z-40 border-b border-zinc-900">
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest relative ${activeTab === tab ? "text-white" : "text-zinc-600"}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="underline" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="divide-y divide-zinc-900">
        {renderTabContent()}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user}
            onUpdate={fetchProfileData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;