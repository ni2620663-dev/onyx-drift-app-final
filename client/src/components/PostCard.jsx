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

  // 🚀 ভাইরাল শেয়ার কার্ড জেনারেশন (Optimization)
  const generateShareCard = async () => {
    if (!postRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(postRef.current, {
        backgroundColor: "#000000",
        useCORS: true,
        scale: 3, // হাই ডেফিনিশন ইমেজ
        logging: false,
        ignoreElements: (element) => element.tagName === "BUTTON" || element.classList.contains('video-controls'),
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Onyx_Post_${post._id.slice(-4)}.png`;
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

  const togglePlay = () => {
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#000000] border border-[#1A1A1A] rounded-[2.5rem] overflow-hidden mb-6 w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all hover:border-[#333]"
    >
      {/* --- Header Area --- */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-b from-[#333] to-[#000] cursor-pointer active:scale-90 transition-transform"
          >
            <img 
              src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
              className="w-full h-full rounded-full object-cover border-2 border-black" 
              alt="avatar" 
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>

          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-bold text-white text-[14px] leading-tight flex items-center gap-1.5">
              {post.authorName || 'Drifter'}
              {post.isVerified && <FaCertificate className="text-cyan-400 text-[10px]" />}
            </h4>
            <p className="text-[10px] text-gray-600 font-semibold tracking-wide uppercase mt-0.5">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'ONLINE'} • {post.mediaType || 'SIGNAL'}
            </p>
          </div>
        </div>

        {(user?.sub === post.author || user?.sub === post.authorAuth0Id) && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(confirm("Terminate Signal?")) onDelete(post._id); }} 
            className="p-2 text-[#333] hover:text-rose-500 transition-colors"
          >
            <FaTrashAlt size={14} />
          </button>
        )}
      </div>

      {/* --- Body Text --- */}
      <div className="px-6 pb-4">
        <p className="text-[#D1D1D1] text-[14px] leading-relaxed font-medium">
          {post.text}
        </p>
      </div>

      {/* --- Media Section (Unique Curved) --- */}
      <div className="px-3 pb-3">
        {post.media ? (
          <div className="relative rounded-[2rem] overflow-hidden bg-[#0A0A0A] border border-[#1A1A1A]">
            {post.mediaType === "video" || post.mediaType === "reel" ? (
              <div className={post.mediaType === "reel" ? "aspect-[9/16] max-h-[500px] mx-auto" : "aspect-video"}>
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
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 video-controls"
                >
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 shadow-2xl">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={post.media} 
                className="w-full object-cover max-h-[500px] hover:scale-[1.02] transition-transform duration-700" 
                alt="Broadcast"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
          </div>
        ) : null}
      </div>

      {/* --- Bottom Actions (Minimal) --- */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-[#1A1A1A] bg-[#050505]">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2 group transition-all ${isLiked ? "text-rose-500 scale-105" : "text-gray-500 hover:text-rose-400"}`}
          >
            <div className={`p-2 rounded-full transition-colors ${isLiked ? "bg-rose-500/10" : "group-hover:bg-rose-500/5"}`}>
              {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
            </div>
            <span className="text-[11px] font-bold">{likesArray.length}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 group transition-colors">
            <div className="p-2 rounded-full group-hover:bg-cyan-500/5 transition-colors">
              <FaRegComment size={18} />
            </div>
            <span className="text-[11px] font-bold">{post.comments?.length || 0}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); generateShareCard(); }}
            disabled={isCapturing}
            className="p-3 text-gray-500 hover:text-white transition-all bg-[#111] rounded-2xl border border-[#222]"
            title="Download Post"
          >
            <FaDownload size={14} className={isCapturing ? "animate-bounce" : ""} />
          </button>
          
          <button className="p-3 text-gray-500 hover:text-white transition-all bg-[#111] rounded-2xl border border-[#222]">
            <FaShareAlt size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;