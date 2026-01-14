import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  // ব্যাকএন্ড ইউআরএল কনফিগারেশন
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/reels/all`); 
        setReels(response.data);
      } catch (err) {
        console.error("Neural Reels Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [API_URL]);

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      style={{ scrollBehavior: 'smooth' }}
    >
      {loading ? (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-[10px] text-cyan-500 font-black tracking-[0.5em] uppercase animate-pulse">Syncing Neural Feed...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="h-screen flex items-center justify-center text-white/40 font-mono text-xs uppercase tracking-widest">
          No signals found in this sector.
        </div>
      ) : (
        reels.map((reel) => (
          <ReelItem key={reel._id} reel={reel} API_URL={API_URL} />
        ))
      )}
    </div>
  );
};

const ReelItem = ({ reel, API_URL }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);

  // এনগেজমেন্ট ট্র্যাক (Pulse)
  const handleEngagement = async () => {
    try {
      await axios.post(`${API_URL}/api/posts/${reel._id}/pulse`);
    } catch (err) {
      console.log("Pulse failed");
    }
  };

  // শেয়ার লজিক
  const handleShare = (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Onyx Drift Reel',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Neural Signal Copied to Clipboard!");
    }
  };

  // অটো-প্লে এবং ইন্টারসেকশন অবজারভার
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            const timer = setTimeout(() => {
              if (entry.isIntersecting) handleEngagement();
            }, 5000);
            return () => clearTimeout(timer);
          } else {
            videoRef.current?.pause();
            if (videoRef.current) videoRef.current.currentTime = 0;
          }
        });
      },
      { threshold: 0.7 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    // এখানে আপনার লাইক API কল যোগ করতে পারেন
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLikeToggle();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const avatarUrl = reel.authorAvatar && !reel.authorAvatar.includes("placeholder") 
    ? reel.authorAvatar 
    : `https://ui-avatars.com/api/?name=${reel.authorName || 'D'}&background=random&color=fff`;

  return (
    <div 
      className="h-screen w-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
      onDoubleClick={handleDoubleTap}
    >
      {/* হার্ট এনিমেশন */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <Heart size={100} fill="#00f7ff" className="text-cyan-400 drop-shadow-[0_0_20px_rgba(0,247,255,0.8)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <video
        ref={videoRef}
        src={reel.media || reel.mediaUrl}
        className="w-full h-full object-cover cursor-pointer"
        loop
        playsInline
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
      />

      {/* কন্টেন্ট লেয়ার */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 flex flex-col justify-end p-5 pb-28">
        <div className="flex justify-between items-end w-full">
          
          <div className="flex-1 pr-12 text-white space-y-4">
            {/* প্রোফাইল সেকশন */}
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${reel.authorAuth0Id || reel.authorId}`)}>
                <img 
                  src={avatarUrl} 
                  className="w-11 h-11 rounded-full border-2 border-cyan-500/50 object-cover" 
                  alt="author" 
                />
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 text-black border-2 border-black">
                  <UserPlus size={10} strokeWidth={4} />
                </div>
              </div>
              <div className="cursor-pointer" onClick={() => navigate(`/profile/${reel.authorAuth0Id || reel.authorId}`)}>
                <h4 className="font-black text-sm tracking-tighter">@{reel.authorName || 'Drifter'}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                  <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em]">Neural Signal</p>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed line-clamp-2 opacity-90 font-medium max-w-[85%]">
              {reel.text || reel.content}
            </p>

            {/* মিউজিক মারকিউ */}
            <div className="flex items-center gap-2 py-1 px-3 bg-white/5 backdrop-blur-md rounded-full w-fit border border-white/10 overflow-hidden">
              <Music size={12} className="animate-spin-slow text-cyan-400 shrink-0" />
              <div className="w-32 overflow-hidden relative">
                <p className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap inline-block animate-marquee-text">
                   {reel.authorName} • Original Neural Audio Track • {reel.authorName} • Original Neural Audio Track
                </p>
              </div>
            </div>
          </div>

          {/* সাইডবার অ্যাকশন বাটন */}
          <div className="flex flex-col gap-6 items-center z-[999]">
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleLikeToggle(); }} 
                className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-75 transition-all"
              >
                <Heart 
                  size={26} 
                  fill={isLiked ? "#00f7ff" : "none"} 
                  className={isLiked ? "text-cyan-400" : "text-white opacity-80"} 
                />
              </button>
              <span className="text-[10px] font-black text-white">{likesCount}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10">
                <MessageCircle size={26} className="text-white opacity-80" />
              </button>
              <span className="text-[10px] font-black text-white">{reel.comments?.length || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleShare(reel._id); }}
                className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10"
              >
                <Share2 size={26} className="text-white opacity-80" />
              </button>
              <span className="text-[8px] font-black uppercase tracking-tighter text-white">Signal</span>
            </div>

            <div 
              className="w-10 h-10 rounded-full border-2 border-cyan-500/30 p-1 animate-spin-slow mt-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              onClick={() => navigate(`/profile/${reel.authorAuth0Id || reel.authorId}`)}
            >
              <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt="disc" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelsFeed;