import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, UserPlus, Copy, Download, ExternalLink, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';

// --- হেল্পার কম্পোনেন্ট: কমেন্ট সেকশন (এখন কাজ করবে) ---
const CommentSheet = ({ reel, onClose, API_URL }) => {
  const [comments, setComments] = useState(reel.comments || []);
  const [newComment, setNewComment] = useState("");
  const { getAccessTokenSilently, user } = useAuth0();

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
      className="fixed bottom-0 left-0 right-0 bg-zinc-900 h-[70vh] rounded-t-[2rem] z-[1002] flex flex-col"
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Neural Feedback ({comments.length})
        </span>
        <X size={20} onClick={onClose} className="text-white/40 cursor-pointer" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((c, i) => (
          <div key={i} className="flex gap-3">
            <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-8 h-8 rounded-full border border-cyan-500/20" />
            <div>
              <p className="text-[10px] font-bold text-cyan-400">@{c.userName}</p>
              <p className="text-xs text-white/80">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
        <input 
          value={newComment} onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add feedback..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-xs outline-none focus:border-cyan-500/50"
        />
        <button onClick={handleSendComment} className="p-2 bg-cyan-500 rounded-full text-black">
          <Send size={16} />
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
    <div className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {loading ? (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-black">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        reels.map((reel) => <ReelItem key={reel._id} reel={reel} API_URL={API_URL} />)
      )}
    </div>
  );
};

// --- রিল আইটেম কম্পোনেন্ট (TikTok Style) ---
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
    }, { threshold: 0.8 });
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
    <div className="h-screen w-full snap-start relative bg-black flex flex-col items-center justify-center">
      {/* হার্ট এনিমেশন */}
      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 2 }} exit={{ opacity: 0 }} className="absolute z-50 pointer-events-none">
            <Heart fill="#00f7ff" className="text-cyan-400 drop-shadow-[0_0_15px_#00f7ff]" size={80} />
          </motion.div>
        )}
      </AnimatePresence>

      <video
        ref={videoRef} src={reel.media} loop playsInline
        className="w-full h-full object-cover"
        onDoubleClick={handleDoubleTap}
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
      />

      {/* কন্টেন্ট এবং একশন বাটন (TikTok Style) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 flex items-end p-4 pb-24">
        <div className="flex w-full justify-between items-end">
          
          {/* প্রোফাইল এবং টেক্সট */}
          <div className="flex-1 text-white space-y-3">
            <div className="flex items-center gap-3">
              <img src={reel.authorAvatar} className="w-12 h-12 rounded-full border-2 border-cyan-500" onClick={() => navigate(`/profile/${reel.authorAuth0Id}`)} />
              <div>
                <h4 className="font-black text-sm tracking-tighter cursor-pointer">@{reel.authorName}</h4>
                <p className="text-[10px] text-cyan-400 uppercase font-black tracking-widest">Neural Link Active</p>
              </div>
            </div>
            <p className="text-sm opacity-90 max-w-[80%] line-clamp-2">{reel.text}</p>
            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
              <Music size={12} className="animate-spin-slow" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Original Audio - {reel.authorName}</span>
            </div>
          </div>

          {/* সাইড একশন বার */}
          <div className="flex flex-col gap-5 items-center">
            <SideBtn icon={<Heart fill={isLiked ? "#00f7ff" : "none"} className={isLiked ? "text-cyan-400" : "text-white"} />} label={likesCount} onClick={handleLike} />
            <SideBtn icon={<MessageCircle />} label={reel.comments?.length || 0} onClick={() => setIsCommentOpen(true)} />
            <SideBtn icon={<Share2 />} label="Share" />
            <div className="w-10 h-10 rounded-full border border-cyan-500/30 p-1 animate-spin-slow">
              <img src={reel.authorAvatar} className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* কমেন্ট এবং শেয়ার শীট */}
      <AnimatePresence>
        {isCommentOpen && <CommentSheet reel={reel} API_URL={API_URL} onClose={() => setIsCommentOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

const SideBtn = ({ icon, label, onClick }) => (
  <div className="flex flex-col items-center gap-1">
    <button onClick={onClick} className="w-12 h-12 rounded-full flex items-center justify-center active:scale-75 transition-all">
      {React.cloneElement(icon, { size: 30 })}
    </button>
    <span className="text-[10px] font-black text-white">{label}</span>
  </div>
);

export default ReelsFeed;