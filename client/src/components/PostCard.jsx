import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, 
  FaPlay, FaPause, FaDownload, FaCertificate 
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
        backgroundColor: "#0f172a",
        useCORS: true,
        scale: 2,
        logging: false,
        ignoreElements: (element) => {
          // ক্যাপচার করার সময় বাটন এবং ভিডিও প্লেয়ার হাইড করা
          return element.tagName === "BUTTON" || element.classList.contains('video-controls');
        },
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Onyx_Echo_${post._id.slice(-6)}.png`;
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
    if (!isAuthenticated) return alert("Neural login required.");
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
      viewport={{ once: true }}
      className="backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden mb-8 w-full bg-[#0f172a] shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
    >
      {/* --- Header --- */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className="p-[1.5px] rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-500 cursor-pointer active:scale-90 transition-transform"
          >
            <img 
              src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}&background=0D1117&color=fff`} 
              className="w-10 h-10 rounded-2xl object-cover border-2 border-[#0f172a]" 
              alt="avatar" 
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>

          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-black text-white text-[13px] tracking-tight uppercase italic flex items-center gap-1.5">
              {post.authorName || 'Anonymous Drifter'}
              {post.isVerified && <FaCertificate className="text-cyan-400 text-[10px]" />}
            </h4>
            <p className="text-[8px] text-gray-500 font-bold tracking-[0.15em] uppercase">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'SYNCED'} • {post.mediaType || 'TEXT'}
            </p>
          </div>
        </div>

        {/* Delete Options */}
        {(user?.sub === post.author || user?.sub === post.authorAuth0Id) && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(confirm("Terminate Signal?")) onDelete(post._id); }} 
            className="p-2 text-gray-600 hover:text-rose-500 transition-colors"
          >
            <FaTrashAlt size={12} />
          </button>
        )}
      </div>

      {/* --- Body Text --- */}
      <div className="px-7 pb-4">
        <p className="text-gray-300 text-[13px] leading-relaxed font-medium">
          {post.text}
        </p>
      </div>

      {/* --- Media Section --- */}
      <div className="px-4 pb-4">
        {post.media ? (
          <div className="relative rounded-[1.8rem] overflow-hidden bg-black/20 border border-white/5">
            {post.mediaType === "video" || post.mediaType === "reel" ? (
              <div className={post.mediaType === "reel" ? "aspect-[9/16] max-h-[550px] mx-auto" : "aspect-video"}>
                <video
                  ref={videoRef}
                  src={post.media}
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onClick={togglePlay}
                />
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer video-controls"
                >
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={post.media} 
                className="w-full object-cover max-h-[500px]" 
                alt="Broadcast"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
          </div>
        ) : null}
      </div>

      {/* --- Footer Actions --- */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2 transition-all ${isLiked ? "text-rose-500 scale-110" : "text-gray-500 hover:text-rose-400"}`}
          >
            {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
            <span className="text-[10px] font-black italic">{likesArray.length}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors">
            <FaRegComment size={16} />
            <span className="text-[10px] font-black italic">{post.comments?.length || 0}</span>
          </button>
        </div>
        
        <button 
          onClick={generateShareCard}
          disabled={isCapturing}
          className="group px-4 py-2 bg-white/5 hover:bg-cyan-500/10 rounded-xl text-gray-500 hover:text-cyan-400 transition-all flex items-center gap-2 border border-white/5"
        >
          <FaDownload size={12} className={isCapturing ? "animate-bounce" : ""} />
          <span className="text-[9px] font-black uppercase tracking-widest italic">
            {isCapturing ? 'Capturing...' : 'Capture'}
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;