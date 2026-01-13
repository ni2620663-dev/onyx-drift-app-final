import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, 
  FaPlay, FaPause, FaDownload, FaCertificate, FaShareAlt
} from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import html2canvas from "html2canvas";

const PostCard = ({ post, onAction, onDelete, onUserClick }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isLiking, setIsLiking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef(null);
  const postRef = useRef(null);

  if (!post) return null;

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const likesArray = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = user && likesArray.includes(user.sub);

  // 🚀 ভাইরাল শেয়ার কার্ড জেনারেশন (HD Quality)
  const generateShareCard = async () => {
    if (!postRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(postRef.current, {
        backgroundColor: "#020617",
        useCORS: true,
        scale: 3, 
        logging: false,
        borderRadius: 40,
        ignoreElements: (element) => element.tagName === "BUTTON" || element.classList.contains('video-controls'),
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Onyx_Post_${post._id?.slice(-4)}.png`;
      link.click();
    } catch (err) {
      console.error("Capture Error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    const targetId = post.authorAuth0Id || post.author;
    if (onUserClick && targetId) onUserClick(targetId);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (isLiking) return;
    try {
      setIsLiking(true);
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onAction) onAction();
    } catch (err) { 
      console.error("Like Error:", err);
    } finally { 
      setIsLiking(false); 
    }
  };

  return (
    <motion.div 
      ref={postRef}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="bg-[#0a0f1e]/60 backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] overflow-hidden mb-6 w-full shadow-2xl transition-all hover:border-cyan-500/20 group/card"
    >
      {/* --- Header Area --- */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            onClick={handleProfileClick}
            className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500 to-purple-600 cursor-pointer active:scale-90 transition-all shadow-lg shadow-cyan-500/10"
          >
            <div className="bg-[#020617] rounded-full p-[1px] w-full h-full">
              <img 
                src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
                className="w-full h-full rounded-full object-cover" 
                alt="avatar" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-bold text-white text-[15px] leading-tight flex items-center gap-1.5 tracking-tight group-hover/card:text-cyan-400 transition-colors">
              {post.authorName || 'Drifter'}
              {post.isVerified && <FaCertificate className="text-cyan-400 text-[10px]" />}
            </h4>
            <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5 opacity-60">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'ONLINE'} • {post.mediaType || 'SIGNAL'}
            </p>
          </div>
        </div>

        {(user?.sub === post.author || user?.sub === post.authorAuth0Id) && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(window.confirm("Terminate Signal?")) onDelete(post._id); }} 
            className="p-3 text-gray-600 hover:text-rose-500 transition-all bg-white/[0.02] hover:bg-rose-500/10 rounded-2xl"
          >
            <FaTrashAlt size={12} />
          </button>
        )}
      </div>

      {/* --- Body Text --- */}
      {post.text && (
        <div className="px-6 pb-4">
          <p className="text-gray-300 text-[15px] leading-[1.6] font-normal selection:bg-cyan-500/30">
            {post.text}
          </p>
        </div>
      )}

      {/* --- Media Section --- */}
      <div className="px-3 pb-3">
        {post.media ? (
          <div className="relative rounded-[2rem] overflow-hidden bg-[#020617] border border-white/5 group/media shadow-inner">
            {post.mediaType === "video" || post.mediaType === "reel" ? (
              <div className={post.mediaType === "reel" ? "aspect-[9/16] max-h-[550px] mx-auto" : "aspect-video"}>
                <video
                  ref={videoRef}
                  src={post.media}
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlay}
                />
                <div 
                  onClick={togglePlay}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black/40 video-controls ${isPlaying ? "opacity-0 group-hover/media:opacity-100" : "opacity-100"}`}
                >
                  <div className="p-6 bg-white/10 backdrop-blur-2xl rounded-full text-white border border-white/20 shadow-2xl scale-90 group-hover/media:scale-100 transition-all">
                    {isPlaying ? <FaPause size={22} /> : <FaPlay size={22} className="ml-1" />}
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={post.media} 
                className="w-full object-cover max-h-[650px] transition-transform duration-[3s] group-hover/media:scale-105" 
                alt="Broadcast"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : null}
      </div>

      {/* --- Bottom Actions --- */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/[0.03] bg-gradient-to-b from-transparent to-black/20">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2.5 group transition-all ${isLiked ? "text-rose-500" : "text-gray-400 hover:text-rose-400"}`}
          >
            <div className={`p-2 rounded-full transition-all ${isLiked ? "bg-rose-500/10" : "group-hover:bg-rose-500/5"}`}>
              {isLiked ? <FaHeart size={19} className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" /> : <FaRegHeart size={19} />}
            </div>
            <span className="text-[13px] font-bold tracking-tight">{likesArray.length}</span>
          </button>

          <button className="flex items-center gap-2.5 text-gray-400 hover:text-cyan-400 group transition-all">
            <div className="p-2 rounded-full group-hover:bg-cyan-500/5 transition-all">
              <FaRegComment size={19} />
            </div>
            <span className="text-[13px] font-bold tracking-tight">{post.comments?.length || 0}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={(e) => { e.stopPropagation(); generateShareCard(); }}
            disabled={isCapturing}
            className="p-3 text-gray-400 hover:text-cyan-400 transition-all bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/5 active:scale-95"
          >
            <FaDownload size={14} className={isCapturing ? "animate-pulse text-cyan-500" : ""} />
          </button>
          
          <button className="p-3 text-gray-400 hover:text-purple-400 transition-all bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/5 active:scale-95">
            <FaShareAlt size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;