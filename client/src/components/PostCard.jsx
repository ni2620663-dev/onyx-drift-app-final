import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, 
  FaShare, FaPaperPlane, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaDownload 
} from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import html2canvas from "html2canvas";

const PostCard = ({ post, onAction, onDelete, onUserClick }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const postRef = useRef(null);

  if (!post) return null;

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");
  const likesArray = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = user && likesArray.includes(user.sub);

  // 🚀 ভাইরাল শেয়ার কার্ড জেনারেশন (Fixed CORS & Rendering)
  const generateShareCard = async () => {
    if (!postRef.current) return;
    
    try {
      const canvas = await html2canvas(postRef.current, {
        backgroundColor: "#0f172a", // কার্ডের আসল ব্যাকগ্রাউন্ড কালার
        useCORS: true,             // এক্সটার্নাল ইমেজের জন্য বাধ্যতামূলক
        allowTaint: false,
        scale: 2,                  // হাই-কোয়ালিটি ইমেজের জন্য
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,  // স্ক্রল পজিশন ফিক্স
        ignoreElements: (element) => element.tagName === "VIDEO" || element.tagName === "BUTTON",
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `OnyxDrift_${post.authorName || 'Echo'}.png`;
      link.click();
    } catch (err) {
      console.error("Share Card Capture Error:", err);
      alert("Neural Capture Failed: Background tasks are blocking the link. Try again.");
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    const targetId = post.authorAuth0Id || post.author || post.userId;
    if (onUserClick && targetId) {
      onUserClick(targetId);
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
      console.error("Like Error:", err.message);
    } finally { 
      setIsLiking(false); 
    }
  };

  return (
    <motion.div 
      ref={postRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-3xl border border-white/5 rounded-[2.8rem] overflow-hidden mb-10 w-full bg-[#0f172a] shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            onClick={handleProfileClick}
            className="p-[2px] rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 cursor-pointer"
          >
            <img 
              src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'Drifter'}&background=random`} 
              className="w-11 h-11 rounded-[0.9rem] object-cover border-2 border-[#0f172a]" 
              alt="author" 
              referrerPolicy="no-referrer" // CORS Header ফিক্স
            />
          </div>

          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-black text-white text-sm tracking-tight uppercase italic flex items-center gap-2">
              {post.authorName || 'DRIFTER'}
              {post.isVerified && <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#22d3ee] animate-pulse"/>}
            </h4>
            <p className="text-[9px] text-gray-500 font-black tracking-[0.2em] uppercase mt-0.5">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'ONLINE'} • {post.mediaType || 'SIGNAL'}
            </p>
          </div>
        </div>

        {(user?.sub === post.author || user?.sub === post.authorAuth0Id) && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(window.confirm("TERMINATE SIGNAL?")) onDelete(post._id); }} 
            className="p-2.5 text-gray-600 hover:text-rose-500 transition-all"
          >
            <FaTrashAlt size={14} />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="px-9 pb-5">
        <p className="text-gray-300 text-sm font-medium leading-relaxed">
          {post.text}
        </p>
      </div>

      {/* Media Section */}
      <div className="px-5 pb-5">
        {post.media ? (
          post.mediaType === "video" || post.mediaType === "reel" ? (
            <div className={`relative group overflow-hidden rounded-[2rem] bg-black ${post.mediaType === "reel" ? "aspect-[9/16] max-h-[500px]" : "aspect-video"}`}>
              <video
                ref={videoRef}
                src={post.media}
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-4 bg-black/40 backdrop-blur-md rounded-full text-white">
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </div>
              </button>
            </div>
          ) : (
            <img 
              src={post.media} 
              className="rounded-[2.2rem] w-full object-cover max-h-[600px] border border-white/5" 
              alt="Content"
              referrerPolicy="no-referrer" // Cloudinary/External Image CORS ফিক্স
            />
          )
        ) : null}
      </div>

      {/* Actions Footer */}
      <div className="px-8 py-5 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2.5 transition-all ${isLiked ? "text-rose-500" : "text-gray-500 hover:text-rose-400"}`}
          >
            {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
            <span className="text-[10px] font-black italic">{likesArray.length}</span>
          </button>

          <button className="flex items-center gap-2.5 text-gray-500 hover:text-cyan-400">
            <FaRegComment size={18} />
            <span className="text-[10px] font-black italic">{post.comments?.length || 0}</span>
          </button>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); generateShareCard(); }}
          className="px-4 py-2 bg-white/5 hover:bg-cyan-500/20 rounded-xl text-gray-500 hover:text-cyan-400 transition-all flex items-center gap-2 border border-white/5 hover:border-cyan-500/30"
        >
          <FaDownload size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest italic">Capture</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;