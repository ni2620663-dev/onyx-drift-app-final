import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, UserPlus, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';

// --- হেল্পার কম্পোনেন্ট: কমেন্ট সেকশন ---
const CommentSheet = ({ reel, onClose, API_URL }) => {
  const [comments, setComments] = useState(reel.comments || []);
  const [newComment, setNewComment] = useState("");
  const { getAccessTokenSilently } = useAuth0();

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${API_URL}/api/posts/${reel._id}/comment`, 
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data.comments);
      setNewComment("");
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl h-[75vh] rounded-t-[2rem] z-[2000] flex flex-col"
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Neural Feedback ({comments.length})</span>
        <X size={20} onClick={onClose} className="text-white/40 cursor-pointer" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((c, i) => (
          <div key={i} className="flex gap-3">
            <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-9 h-9 rounded-full border border-cyan-500/20" alt="" />
            <div>
              <p className="text-[10px] font-bold text-cyan-400">@{c.userName}</p>
              <p className="text-sm text-white/90">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2 mb-6">
        <input 
          value={newComment} onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add feedback..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <button onClick={handleSendComment} className="p-3 bg-cyan-500 rounded-full text-black active:scale-90 transition-transform">
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
};

// --- মেইন ফিড কম্পোনেন্ট ---
const ReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/reels/all`); 
        setReels(response.data);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [API_URL]);

  return (
    // fixed inset-0 ব্যবহারের ফলে এটি পুরো স্ক্রিন জুড়ে থাকবে এবং অন্য কোনো বার দেখা যাবে না
    <div className="fixed inset-0 bg-black z-[1000] overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {loading ? (
        <div className="h-full flex flex-col items-center justify-center gap-4 bg-black">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Neural Feed</p>
        </div>
      ) : (
        reels.map((reel) => <ReelItem key={reel._id} reel={reel} API_URL={API_URL} />)
      )}
    </div>
  );
};

// --- রিল আইটেম কম্পোনেন্ট (TikTok Full Screen) ---
const ReelItem = ({ reel, API_URL }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) videoRef.current?.play();
        else videoRef.current?.pause();
      });
    }, { threshold: 0.6 });
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLike = async () => {
    try {
      const token = await getAccessTokenSilently();
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      await axios.put(`${API_URL}/api/posts/${reel._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error("Like failed"); }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <div className="h-[100dvh] w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
      
      {/* ১. ভিডিও লেয়ার: object-cover ব্যবহার করা হয়েছে যাতে ফুল স্ক্রিন থাকে */}
      <video
        ref={videoRef} src={reel.media} loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onDoubleClick={handleDoubleTap}
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
      />

      {/* ২. হার্ট এনিমেশন */}
      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 2 }} exit={{ opacity: 0 }} className="absolute z-[1010] pointer-events-none">
            <Heart fill="#ff0050" className="text-[#ff0050] drop-shadow-[0_0_20px_#ff0050]" size={100} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ৩. UI Overlay (Transparent) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 z-[1005] pointer-events-none">
        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-10 pointer-events-none">
          <div className="flex w-full items-end justify-between pointer-events-auto">
            
            {/* প্রোফাইল এবং কন্টেন্ট */}
            <div className="flex-1 text-white pr-12 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <img 
                    src={reel.authorAvatar} 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-xl" 
                    onClick={() => navigate(`/profile/${reel.authorAuth0Id}`)} 
                  />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ff0050] rounded-full w-4 h-4 flex items-center justify-center border border-black text-white text-[12px] font-bold">+</div>
                </div>
                <h4 className="font-bold text-[15px] drop-shadow-md">@{reel.authorName}</h4>
              </div>
              <p className="text-[14px] font-normal leading-snug drop-shadow-lg line-clamp-2 mb-4 opacity-95">{reel.text}</p>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/10">
                <Music size={14} className="animate-spin-slow text-cyan-400" />
                <span className="text-[10px] font-medium tracking-wide">Original Audio - {reel.authorName}</span>
              </div>
            </div>

            {/* সাইড একশন বার */}
            <div className="flex flex-col gap-6 items-center mb-2">
              <SideBtn icon={<Heart fill={isLiked ? "#ff0050" : "none"} className={isLiked ? "text-[#ff0050]" : "text-white"} />} label={likesCount} onClick={handleLike} />
              <SideBtn icon={<MessageCircle fill="white" className="text-white" />} label={reel.comments?.length || 0} onClick={() => setIsCommentOpen(true)} />
              <SideBtn icon={<Share2 fill="white" className="text-white" />} label="Share" />
              <div className="w-10 h-10 rounded-full border-2 border-zinc-700 p-2 bg-zinc-900 animate-spin-slow mt-2 shadow-2xl">
                <img src={reel.authorAvatar} className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* কমেন্ট শীট */}
      <AnimatePresence>
        {isCommentOpen && <CommentSheet reel={reel} API_URL={API_URL} onClose={() => setIsCommentOpen(false)} />}
      </AnimatePresence>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const SideBtn = ({ icon, label, onClick }) => (
  <div className="flex flex-col items-center gap-1.5">
    <button onClick={onClick} className="w-12 h-12 flex items-center justify-center active:scale-50 transition-all drop-shadow-lg">
      {React.cloneElement(icon, { size: 36 })}
    </button>
    <span className="text-[11px] font-bold text-white drop-shadow-md">{label}</span>
  </div>
);

export default ReelsFeed;