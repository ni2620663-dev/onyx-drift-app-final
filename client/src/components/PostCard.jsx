import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, 
  FaShare, FaPaperPlane, FaPlay, FaPause, FaVolumeMute, FaVolumeUp 
} from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const PostCard = ({ post, onAction, onDelete, onUserClick }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  if (!post) return null;

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  const likesArray = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = user && likesArray.includes(user.sub);

  // ক্লিক হ্যান্ডলার: প্রোফাইল পিকচার বা নামের ওপর ক্লিক করলে আইডিDiscovery পেজে পাঠাবে
  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (onUserClick && post.authorId) {
      onUserClick(post.authorId);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return alert("Please login to like this signal");
    if (isLiking) return;
    
    try {
      setIsLiking(true);
      const token = await getAccessTokenSilently();
      
      await axios.put(`${API_URL}/api/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (onAction) onAction();
    } catch (err) { 
      console.error("Like Error:", err.response?.data || err.message);
    } finally { 
      setIsLiking(false); 
    }
  };

  const renderMedia = () => {
    if (!post.media) return null;
    const isVideo = post.mediaType === "video" || post.mediaType === "reel";
    const isReel = post.mediaType === "reel";

    if (isVideo) {
      return (
        <div className={`relative group overflow-hidden rounded-[2rem] border border-white/5 bg-black ${isReel ? "aspect-[9/16] max-h-[600px] mx-auto w-[85%]" : "aspect-video"}`}>
          <video
            ref={videoRef}
            src={post.media}
            loop
            muted={isMuted}
            className="w-full h-full object-cover cursor-pointer"
            onClick={togglePlay}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 pointer-events-none">
            <div className="flex items-center justify-between pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-3 bg-cyan-400/20 backdrop-blur-md rounded-full text-cyan-400">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="px-2">
        <img 
          src={post.media} 
          className="rounded-[2rem] w-full object-cover max-h-[500px] border border-white/5 shadow-2xl transition-all hover:scale-[1.005]" 
          alt="Neural Post"
        />
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden mb-8 w-full group/card"
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* প্রোফাইল পিকচার এবং নামের ক্লিক হ্যান্ডলার যুক্ত করা হয়েছে */}
          <div 
            onClick={handleProfileClick}
            className="p-[2px] rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 cursor-pointer active:scale-90 transition-transform"
          >
            <img 
              src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'User'}&background=random`} 
              className="w-10 h-10 rounded-[0.8rem] object-cover border-2 border-[#020617]" 
              alt="author" 
            />
          </div>
          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-black text-white text-xs tracking-tighter uppercase italic hover:text-cyan-400 transition-colors">
              {post.authorName || 'Anonymous'}
            </h4>
            <p className="text-[8px] text-gray-500 font-bold tracking-[0.2em] uppercase">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'} • {post.mediaType || 'neural'}
            </p>
          </div>
        </div>

        {(user?.sub === post.authorId || user?.email === post.authorId) && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if(window.confirm("Are you sure you want to delete this signal?")) {
                onDelete(post._id);
              }
            }} 
            className="p-2 text-gray-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
          >
            <FaTrashAlt size={14} />
          </button>
        )}
      </div>

      <div className="px-8 pb-4">
        <p className="text-gray-300 text-sm font-light leading-relaxed tracking-wide">
          {post.text}
        </p>
      </div>

      <div className="px-4 pb-4">
        {renderMedia()}
      </div>

      <div className="px-8 py-5 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLike} 
            disabled={isLiking}
            className={`flex items-center gap-2 group transition-all ${isLiked ? "text-rose-500" : "text-gray-500 hover:text-rose-400"}`}
          >
            <motion.div whileTap={{ scale: 0.8 }}>
              {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest">{likesArray.length}</span>
          </button>

          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-500 hover:text-cyan-400">
            <FaRegComment size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{post.comments?.length || 0}</span>
          </button>
        </div>
        <FaShare className="text-gray-600 hover:text-white transition-all cursor-pointer" size={16} />
      </div>
      
      {/* কমেন্ট সেকশন আনচেঞ্জড (যদি লাগে) */}
    </motion.div>
  );
};

export default PostCard;