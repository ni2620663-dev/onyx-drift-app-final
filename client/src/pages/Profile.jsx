import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaCamera 
} from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';
import { HiXMark } from "react-icons/hi2"; // Modal close icon
import EditProfileModal from "./EditProfileModal";
import SignalCard from "./SignalCard";

const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const API_AUDIENCE = "https://onyx-drift-api.com";

/* ==========================================================
    👤 FOLLOW LIST MODAL COMPONENT
========================================================== */
const FollowListModal = ({ isOpen, onClose, title, list }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black border border-zinc-800 w-full max-w-md h-[500px] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-900">
          <h3 className="font-black uppercase tracking-widest text-sm text-cyan-500">{title}</h3>
          <button onClick={onClose} className="text-white hover:bg-zinc-900 p-2 rounded-full transition-colors">
            <HiXMark size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {list && list.length > 0 ? (
            list.map((person) => (
              <div 
                key={person.auth0Id}
                onClick={() => { navigate(`/profile/${person.auth0Id}`); onClose(); }}
                className="flex items-center gap-3 p-3 hover:bg-zinc-900/50 rounded-xl cursor-pointer transition-all group"
              >
                <img src={person.avatar || person.picture} className="w-10 h-10 rounded-full object-cover border border-zinc-800" alt="av" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold group-hover:text-cyan-400 transition-colors">{person.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">@{person.nickname}</p>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">View</button>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest">No Links Found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ==========================================================
    🌐 MAIN PROFILE PAGE
========================================================== */
const ProfilePage = () => {
  const { userId: profileId } = useParams(); 
  const { user: currentUser, getAccessTokenSilently } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Signals");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [followModal, setFollowModal] = useState({ isOpen: false, title: "", list: [] });

  const tabs = ["Signals", "Replies", "Media", "Energy"];

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: API_AUDIENCE },
      });

      const profileRes = await axios.get(`${BACKEND_URL}/api/profile/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileRes.data);

      const postsRes = await axios.get(`${BACKEND_URL}/api/profile/posts/user/${profileId}`, {
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

  const openFollowModal = async (type) => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: API_AUDIENCE },
      });
      const res = await axios.get(`${BACKEND_URL}/api/profile/${profileId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowModal({ 
        isOpen: true, 
        title: type === 'followers' ? 'Followers' : 'Following', 
        list: res.data 
      });
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // Helper to show empty state
  const EmptyState = ({ msg }) => (
    <div className="py-20 text-center text-zinc-600 text-[10px] uppercase tracking-widest italic font-mono">
      {msg}
    </div>
  );

  const isReallyMe = currentUser?.sub === profileId;
  const defaultBanner = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070";
  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'Drifter'}`;

  /* FIXED: UPDATED TAB RENDERING LOGIC */
  const renderTabContent = () => {
    if (loading) return null;

    switch (activeTab) {
      case "Signals":
        // Filter main posts (not replies)
        const signals = userPosts.filter(post => !post.parentId);
        return signals.length > 0 ? (
          signals.map((post) => (
            <SignalCard key={post._id} post={post} user={user} currentUserAuth0Id={currentUser?.sub} />
          ))
        ) : <EmptyState msg="No Signals Broadcasted" />;

      case "Replies":
        // Filter posts that are replies (have parentId)
        const replies = userPosts.filter(post => post.parentId);
        return replies.length > 0 ? (
          replies.map((post) => (
            <SignalCard key={post._id} post={post} user={user} currentUserAuth0Id={currentUser?.sub} />
          ))
        ) : <EmptyState msg="No Neural Replies Found" />;

      case "Media":
        // Filter posts that contain images or videos
        const mediaPosts = userPosts.filter(p => p.image || p.video);
        return mediaPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 p-1">
            {mediaPosts.map(post => (
              <div key={post._id} className="aspect-square bg-zinc-900 border border-zinc-800 overflow-hidden relative group cursor-pointer">
                {post.image ? (
                  <img 
                    src={post.image} 
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity" 
                    alt="media" 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Media+Error'; }}
                  />
                ) : post.video ? (
                  <video src={post.video} className="w-full h-full object-cover" controls={false} />
                ) : null}
              </div>
            ))}
          </div>
        ) : <EmptyState msg="No Visual Data Injected" />;

      case "Energy":
        return (
          <div className="p-8 space-y-6">
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.05)]">
              <h3 className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Neural Link Integrity</h3>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '82%' }} 
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_#06b6d4]" 
                />
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-[9px] text-zinc-500 tracking-widest uppercase">Status: Optimal</p>
                <p className="text-[9px] text-cyan-500 font-bold tracking-widest uppercase">82% Sync</p>
              </div>
            </div>
          </div>
        );

      default:
        return <EmptyState msg="Module Encryption Active" />;
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
        <div className="h-40 md:h-48 bg-zinc-900 overflow-hidden relative border-b border-zinc-900">
          <img 
            src={user?.coverImg || defaultBanner} 
            className="w-full h-full object-cover opacity-80" 
            alt="cover" 
          />
          {isReallyMe && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
               <button onClick={() => setIsEditModalOpen(true)} className="bg-black/60 p-3 rounded-full border border-white/20 hover:scale-110 transition-transform"><FaCamera /></button>
            </div>
          )}
        </div>

        <div className="px-4 relative">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black bg-black overflow-hidden relative z-10 shadow-xl">
              <img 
                src={user?.avatar || user?.picture || defaultAvatar} 
                className="w-full h-full object-cover rounded-full" 
                alt="avatar" 
              />
              {isReallyMe && (
                <div onClick={() => setIsEditModalOpen(true)} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity z-20">
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
              <span className="flex items-center gap-1">
                <FaCalendarAlt /> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {month:'short', year:'numeric'}) : 'Jan 2026'}
              </span>
            </div>

            <div className="flex gap-5 pt-4 border-t border-zinc-900 mt-4">
              <p 
                onClick={() => openFollowModal('following')}
                className="text-sm cursor-pointer hover:underline decoration-cyan-500"
              >
                <span className="font-black text-white">{user?.following?.length || 0}</span> <span className="text-zinc-500 font-bold uppercase text-[10px]">Following</span>
              </p>
              <p 
                onClick={() => openFollowModal('followers')}
                className="text-sm cursor-pointer hover:underline decoration-cyan-500"
              >
                <span className="font-black text-white">{user?.followers?.length || 0}</span> <span className="text-zinc-500 font-bold uppercase text-[10px]">Followers</span>
              </p>
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
            className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest relative transition-colors ${activeTab === tab ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="underline" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="divide-y divide-zinc-900 min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* 🛠 MODALS */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user}
            onUpdate={fetchProfileData}
          />
        )}
        {followModal.isOpen && (
          <FollowListModal 
            isOpen={followModal.isOpen} 
            onClose={() => setFollowModal({ ...followModal, isOpen: false })}
            title={followModal.title}
            list={followModal.list}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;