import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaRegComment, FaRetweet, FaRegHeart, FaHeart, FaShare, FaEllipsisH 
} from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns'; // সময় দেখানোর জন্য
import axios from 'axios';
import toast from 'react-hot-toast';

const SignalCard = ({ post, currentUserAuth0Id }) => {
  const [isEnergized, setIsEnergized] = useState(post?.energy?.includes(currentUserAuth0Id));
  const [energyCount, setEnergyCount] = useState(post?.energy?.length || 0);

  // Energy (Like) Toggle লজিক
  const handleEnergyToggle = async (e) => {
    e.stopPropagation(); // কার্ডের ক্লিক ইভেন্ট আটকানোর জন্য
    try {
      const response = await axios.post(`/api/posts/${post._id}/energy`);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border-b border-zinc-900 hover:bg-white/[0.02] transition-all cursor-pointer flex gap-3"
    >
      {/* Drifter Avatar */}
      <img 
        src={post.authorAvatar || "https://via.placeholder.com/150"} 
        className="w-11 h-11 rounded-full object-cover bg-zinc-800 flex-shrink-0" 
        alt="avatar" 
      />

      <div className="flex-1 min-w-0">
        {/* Header Info */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="font-bold hover:underline truncate">{post.authorName}</span>
            {post.isVerified && <HiBadgeCheck className="text-cyan-400 flex-shrink-0" />}
            <span className="text-zinc-500 text-sm truncate">@{post.authorNickname || 'drifter'}</span>
            <span className="text-zinc-600 text-xs ml-1">· {formatDistanceToNow(new Date(post.createdAt))}</span>
          </div>
          <FaEllipsisH className="text-zinc-600 hover:text-cyan-400 text-sm" />
        </div>

        {/* Signal Content */}
        <p className="text-[15px] text-zinc-200 mt-1 leading-normal break-words">
          {post.text}
        </p>

        {/* Action Bar (Ecosystem Icons) */}
        <div className="flex justify-between mt-3 text-zinc-500 max-w-md">
          {/* Replies */}
          <div className="flex items-center gap-2 group hover:text-cyan-400 transition-colors">
            <div className="p-2 group-hover:bg-cyan-400/10 rounded-full">
              <FaRegComment size={15} />
            </div>
            <span className="text-xs">{post.comments?.length || 0}</span>
          </div>

          {/* Re-Signal (Retweet) */}
          <div className="flex items-center gap-2 group hover:text-green-400 transition-colors">
            <div className="p-2 group-hover:bg-green-400/10 rounded-full">
              <FaRetweet size={16} />
            </div>
            <span className="text-xs">8</span>
          </div>

          {/* Energy (Like) */}
          <div 
            onClick={handleEnergyToggle}
            className={`flex items-center gap-2 group transition-colors ${isEnergized ? 'text-pink-500' : 'hover:text-pink-500'}`}
          >
            <div className={`p-2 rounded-full ${isEnergized ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
              {isEnergized ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
            </div>
            <span className="text-xs font-bold">{energyCount > 0 ? energyCount : 'Energy'}</span>
          </div>

          {/* Share */}
          <div className="flex items-center gap-2 group hover:text-cyan-400 transition-colors">
            <div className="p-2 group-hover:bg-cyan-400/10 rounded-full">
              <FaShare size={14} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignalCard;