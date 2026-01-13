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
        backgroundColor: "#000000",
        useCORS: true,
        scale: 3, 
        logging: false,
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-[#050505] border border-white/5 rounded-[2.5rem] overflow-hidden mb-8 w-full shadow-2xl transition-all hover:border-white/10"
    >
      {/* --- Header Area --- */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/20 cursor-pointer active:scale-90 transition-all"
          >
            <img 
              src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
              className="w-full h-full rounded-full object-cover border-2 border-black" 
              alt="avatar" 
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-black text-white text-[14px] leading-tight flex items-center gap-1.5 uppercase tracking-tighter">
              {post.authorName || 'Drifter'}
              {post.isVerified && <FaCertificate className="text-cyan-400 text-[10px]" />}
            </h4>
            <p className="text-[9px] text-gray-600 font-black tracking-[0.1em] uppercase mt-0.5">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'ONLINE'} • {post.mediaType || 'SIGNAL'}
            </p>
          </div>
        </div>

        {(user?.sub === post.author || user?.sub === post.authorAuth0Id) && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(window.confirm("Terminate Signal?")) onDelete(post._id); }} 
            className="p-3 text-gray-800 hover:text-rose-500 transition-colors bg-white/5 rounded-full"
          >
            <FaTrashAlt size={12} />
          </button>
        )}
      </div>

      {/* --- Body Text --- */}
      {post.text && (
        <div className="px-7 pb-5">
          <p className="text-[#A1A1A1] text-[15px] leading-relaxed font-medium selection:bg-cyan-500/30">
            {post.text}
          </p>
        </div>
      )}

      {/* --- Media Section --- */}
      <div className="px-4 pb-4">
        {post.media ? (
          <div className="relative rounded-[2rem] overflow-hidden bg-[#0A0A0A] border border-white/5 group">
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
                {/* Video Overlay Controls */}
                <div 
                  onClick={togglePlay}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black/20 video-controls ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
                >
                  <div className="p-5 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                    {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} className="ml-1" />}
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={post.media} 
                className="w-full object-cover max-h-[600px] transition-transform duration-[2s] group-hover:scale-105" 
                alt="Broadcast"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : null}
      </div>

      {/* --- Bottom Actions --- */}
      <div className="px-6 py-5 flex items-center justify-between border-t border-white/[0.03] bg-[#030303]/50">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2 group transition-all ${isLiked ? "text-rose-500" : "text-gray-500 hover:text-rose-400"}`}
          >
            <div className={`p-2.5 rounded-full transition-all ${isLiked ? "bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]" : "group-hover:bg-rose-500/5"}`}>
              {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
            </div>
            <span className="text-[12px] font-black tracking-tighter">{likesArray.length}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 group transition-all">
            <div className="p-2.5 rounded-full group-hover:bg-cyan-500/5 transition-all">
              <FaRegComment size={18} />
            </div>
            <span className="text-[12px] font-black tracking-tighter">{post.comments?.length || 0}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={(e) => { e.stopPropagation(); generateShareCard(); }}
            disabled={isCapturing}
            className="p-3.5 text-gray-500 hover:text-cyan-400 transition-all bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/5 active:scale-90"
            title="Download Post"
          >
            <FaDownload size={14} className={isCapturing ? "animate-bounce text-cyan-500" : ""} />
          </button>
          
          <button className="p-3.5 text-gray-500 hover:text-purple-400 transition-all bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/5 active:scale-90">
            <FaShareAlt size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;