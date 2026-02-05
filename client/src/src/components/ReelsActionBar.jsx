import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaCommentDots, FaShareAlt, FaAward, FaUserCircle } from 'react-icons/fa';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

// API URL (আপনার আগের কোড থেকে নেওয়া)
const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

const ReelsActionBar = ({ post, onPostUpdate, onCommentClick, onShareClick }) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.sub));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [rankClicks, setRankClicks] = useState(post.rankClicks?.length || 0);
  const [hasRankedUp, setHasRankedUp] = useState(post.rankClicks?.includes(user?.sub)); // ইউজার অলরেডি র‍্যাঙ্ক আপ করেছে কিনা

  useEffect(() => {
    setIsLiked(post.likes?.includes(user?.sub));
    setLikeCount(post.likes?.length || 0);
    setRankClicks(post.rankClicks?.length || 0);
    setHasRankedUp(post.rankClicks?.includes(user?.sub));
  }, [post, user]);

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(res.data.likes.includes(user?.sub));
      setLikeCount(res.data.likes.length);
      // onPostUpdate(res.data); // Uncomment if you need to update the parent state
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleRankUp = async () => {
    if (!isAuthenticated || hasRankedUp) return; // যদি অলরেডি র‍্যাঙ্ক আপ করে থাকে, তাহলে আবার করতে পারবে না

    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${post._id}/rank-up`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setRankClicks(res.data.clicks);
        setHasRankedUp(true); // ইউজার একবার ক্লিক করেছে
        if (res.data.rankUp) {
          // এখানে একটি ভিজ্যুয়াল ইভেন্ট ট্রিগার করতে পারেন, যেমন একটি জ্যাপ এনিমেশন
          console.log("Creator's Global Rank Increased! ⚡");
          // Optionally, trigger an actual zap animation on the UI
        }
      }
    } catch (error) {
      console.error("Failed to rank up:", error);
    }
  };

  // Rank Progress Calculation (0 to 9 for the current 10-click cycle)
  const currentRankProgress = rankClicks % 10;

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center space-y-5 z-20">
      {/* Profile Avatar */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-12 h-12 rounded-full border-2 border-cyan-500 overflow-hidden cursor-pointer shadow-lg"
        onClick={() => { /* Navigate to creator profile */ }}
      >
        <img 
          src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}`} 
          alt={post.authorName} 
          className="w-full h-full object-cover"
        />
        <div className="absolute -bottom-2 -right-2 bg-purple-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">
          <FaUserCircle className="text-white text-xs" />
        </div>
      </motion.div>

      {/* Like Button */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={handleLike}
        className="flex flex-col items-center text-white/80"
      >
        <FaHeart size={24} className={isLiked ? "text-red-500" : "text-white/80"} />
        <span className="text-[10px] font-bold mt-1">{likeCount}</span>
      </motion.button>

      {/* Comment Button */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={onCommentClick}
        className="flex flex-col items-center text-white/80"
      >
        <FaCommentDots size={24} />
        <span className="text-[10px] font-bold mt-1">{post.comments?.length || 0}</span>
      </motion.button>

      {/* Share Button */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={onShareClick}
        className="flex flex-col items-center text-white/80"
      >
        <FaShareAlt size={24} />
        <span className="text-[10px] font-bold mt-1">Share</span>
      </motion.button>

      {/* Unique Rank Up Button */}
      <div className="flex flex-col items-center gap-1">
        <motion.button
          whileTap={{ scale: hasRankedUp ? 1 : 0.8, rotate: hasRankedUp ? 0 : -15 }}
          onClick={handleRankUp}
          disabled={hasRankedUp} // একবার ক্লিক করলে ডিসেবল
          className={`p-3 rounded-full border-2 transition-all duration-500 ${
            hasRankedUp 
            ? "border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)] cursor-not-allowed" 
            : "border-cyan-500/50 bg-black/40 text-cyan-400"
          }`}
        >
          <FaAward size={24} className={hasRankedUp ? "text-purple-400" : "animate-pulse"} />
        </motion.button>
        
        {/* Progress Bar for Rank Clicks */}
        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-400" 
            initial={{ width: 0 }}
            animate={{ width: `${(currentRankProgress / 10) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[8px] font-black text-gray-500 uppercase mt-1">
          Rank Up {currentRankProgress}/10
        </span>
      </div>
    </div>
  );
};

export default ReelsActionBar;