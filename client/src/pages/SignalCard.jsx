import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaRegComment, FaRetweet, FaRegHeart, FaHeart, FaShare, FaEllipsisH 
} from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const SignalCard = ({ post, currentUserAuth0Id }) => {
  const [isEnergized, setIsEnergized] = useState(post?.energy?.includes(currentUserAuth0Id) || post?.likes?.includes(currentUserAuth0Id));
  const [energyCount, setEnergyCount] = useState(post?.energy?.length || post?.likes?.length || 0);

  // Energy (Like) Toggle লজিক
  const handleEnergyToggle = async (e) => {
    e.stopPropagation();
    try {
      // ব্যাকএন্ডে likes বা energy যেকোনো একটি এন্ডপয়েন্ট ব্যবহার করুন
      await axios.post(`https://onyx-drift-app-final-u29m.onrender.com/api/posts/${post._id}/energy`);
      setIsEnergized(!isEnergized);
      setEnergyCount(prev => isEnergized ? prev - 1 : prev + 1);
      
      if (!isEnergized) {
        toast.success("Energy Infused! ⚡", {
          style: { background: '#000', color: '#06b6d4', border: '1px solid #222' }
        });
      }
    } catch (err) {
      toast.error("Sync Failure: Neural link weak.");
    }
  };

  // ✅ মিডিয়া ইউআরএল এবং টাইপ ডিটেকশন (ব্যাকএন্ড এর সাথে ম্যাচ করা)
  const mediaSource = post.mediaUrl || post.media || post.image;
  const isVideo = post.mediaType === 'video' || post.postType === 'reels' || post.video;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border-b border-zinc-900 hover:bg-white/[0.02] transition-all cursor-pointer flex gap-3"
    >
      {/* 👤 Author Avatar */}
      <img 
        src={post.authorAvatar || post.authorPicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorName}`} 
        className="w-11 h-11 rounded-full object-cover bg-zinc-800 flex-shrink-0 border border-zinc-800" 
        alt="avatar" 
      />

      <div className="flex-1 min-w-0">
        {/* 🏷️ Header Info */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="font-bold hover:underline truncate text-white">{post.authorName || "Unknown Drifter"}</span>
            {post.isVerified && <HiBadgeCheck className="text-cyan-400 flex-shrink-0" />}
            <span className="text-zinc-500 text-sm truncate">@{post.authorNickname || 'drifter'}</span>
            <span className="text-zinc-600 text-xs ml-1">
              · {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : "just now"}
            </span>
          </div>
          <FaEllipsisH className="text-zinc-600 hover:text-cyan-400 text-sm cursor-pointer" />
        </div>

        {/* 📝 Signal Text Content */}
        <p className="text-[15px] text-zinc-200 mt-1 leading-normal break-words">
          {post.content || post.text}
        </p>

        {/* 🖼️ ✅ FIXED MEDIA SECTION */}
        {mediaSource && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30">
            {isVideo ? (
              <div className="relative group aspect-video bg-black flex items-center justify-center">
                <video 
                  controls 
                  className="w-full h-full object-contain"
                  poster={post.videoThumbnail || ""}
                >
                  <source src={mediaSource} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <img 
                src={mediaSource} 
                alt="signal-media" 
                className="w-full h-auto max-h-[500px] object-cover hover:opacity-90 transition-opacity"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }} // ইমেজ এরর হলে হাইড করবে
              />
            )}
          </div>
        )}

        {/* 📊 Action Bar */}
        <div className="flex justify-between mt-4 text-zinc-500 max-w-md pr-4">
          {/* Replies */}
          <div className="flex items-center gap-2 group hover:text-cyan-400 transition-colors">
            <div className="p-2 group-hover:bg-cyan-400/10 rounded-full transition-all">
              <FaRegComment size={16} />
            </div>
            <span className="text-xs">{post.comments?.length || 0}</span>
          </div>

          {/* Re-Signal */}
          <div className="flex items-center gap-2 group hover:text-green-500 transition-colors">
            <div className="p-2 group-hover:bg-green-500/10 rounded-full transition-all">
              <FaRetweet size={18} />
            </div>
            <span className="text-xs">{post.resignals || 0}</span>
          </div>

          {/* Energy (Like) */}
          <div 
            onClick={handleEnergyToggle}
            className={`flex items-center gap-2 group transition-all ${isEnergized ? 'text-pink-500' : 'hover:text-pink-500'}`}
          >
            <div className={`p-2 rounded-full transition-all ${isEnergized ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
              {isEnergized ? <FaHeart size={16} className="animate-pulse" /> : <FaRegHeart size={16} />}
            </div>
            <span className={`text-xs ${isEnergized ? 'font-black' : ''}`}>
              {energyCount > 0 ? energyCount : 'Energy'}
            </span>
          </div>

          {/* Share */}
          <div className="flex items-center gap-2 group hover:text-cyan-400 transition-colors cursor-pointer">
            <div className="p-2 group-hover:bg-cyan-400/10 rounded-full transition-all">
              <FaShare size={15} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignalCard;