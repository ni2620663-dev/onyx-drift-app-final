import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, Send, X, ArrowLeft, Copy, Download, MessageSquare, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import toast from 'react-hot-toast';

// --- হেল্পার: ডিসপ্লে নাম এবং ছবি বের করার লজিক ---
const getUserData = (reel) => {
  const u = reel.user || reel.author || {};
  const name = u.name || reel.authorName || u.nickname || "Drifter";
  const avatar = u.avatar || u.picture || reel.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1117&color=00f2ff&bold=true`;
  const id = u.auth0Id || u.userId || reel.authorAuth0Id || reel.author || "";
  return { name, avatar, id };
};

// --- শেয়ার মেনু ---
const ShareSheet = ({ reel, onClose }) => {
  const handleCopyLink = () => {
    const link = `${window.location.origin}/reels/${reel._id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
    onClose();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(reel.media);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OnyxDrift-Reel-${reel._id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed.");
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/98 backdrop-blur-2xl p-6 rounded-t-[2rem] z-[3000] flex flex-col gap-6 pb-10"
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h3 className="text-white font-bold text-sm">Share Reel</h3>
        <X size={20} onClick={onClose} className="text-white/40 cursor-pointer" />
      </div>
      <div className="flex justify-around items-center py-4">
        <button onClick={() => window.open(`fb-messenger://share/?link=${encodeURIComponent(window.location.href)}`)} className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white"><MessageSquare size={24} /></div>
          <span className="text-[10px] text-white/70">Messenger</span>
        </button>
        <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center text-white"><Copy size={24} /></div>
          <span className="text-[10px] text-white/70">Copy Link</span>
        </button>
        <button onClick={handleDownload} className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center text-white"><Download size={24} /></div>
          <span className="text-[10px] text-white/70">Download</span>
        </button>
      </div>
    </motion.div>
  );
};

// --- কমেন্ট সেকশন ---
const CommentSheet = ({ reel, onClose, API_URL }) => {
  const [comments, setComments] = useState(reel.comments || []);
  const [newComment, setNewComment] = useState("");
  const { getAccessTokenSilently, user } = useAuth0();

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const temp = { 
      text: newComment, 
      userName: user?.name || user?.nickname || "User", 
      userAvatar: user?.picture, 
      createdAt: new Date().toISOString() 
    };
    setComments([...comments, temp]);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${reel._id}/comment`, { text: newComment }, { headers: { Authorization: `Bearer ${token}` } });
      setComments(res.data.comments);
      setNewComment("");
    } catch (err) { console.error("Comment failed"); }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl h-[70vh] rounded-t-[2rem] z-[3000] flex flex-col shadow-2xl"
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Feedback ({comments.length})</span>
        <X size={20} onClick={onClose} className="text-white/40 cursor-pointer" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((c, i) => (
          <div key={i} className="flex gap-3 items-start">
            <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-8 h-8 rounded-full border border-white/10" alt="" />
            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none flex-1">
              <p className="text-[10px] font-bold text-cyan-400">@{c.userName}</p>
              <p className="text-sm text-white/90 leading-tight mt-1">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex gap-2 mb-8 bg-zinc-900">
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Signal your feedback..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white text-sm outline-none focus:border-cyan-500/50" />
        <button onClick={handleSendComment} className="p-4 bg-cyan-500 rounded-full text-black hover:scale-105 transition-transform"><Send size={18} /></button>
      </div>
    </motion.div>
  );
};

// --- মেইন ফিড ---
const ReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/reels/all`); 
        setReels(response.data);
      } catch (err) { 
        console.error(err); 
        toast.error("Failed to load reels");
      } finally { 
        setLoading(false); 
      }
    };
    fetchReels();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      <button 
        onClick={() => navigate('/feed')} 
        className="fixed top-6 left-4 z-[110] p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/10 transition-all active:scale-90"
      >
        <ArrowLeft size={20} />
      </button>
      
      {loading ? (
        <div className="h-[100dvh] flex items-center justify-center bg-black">
          <div className="w-10 h-10 border-4 border-t-cyan-500 border-white/10 rounded-full animate-spin"></div>
        </div>
      ) : (
        reels.length > 0 ? (
          reels.map((reel) => <ReelItem key={reel._id} reel={reel} API_URL={API_URL} />)
        ) : (
          <div className="h-[100dvh] flex items-center justify-center text-white/50 font-bold tracking-widest uppercase text-xs">No Neural Reels Signal.</div>
        )
      )}
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// --- রিল আইটেম ---
const ReelItem = ({ reel, API_URL }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { getAccessTokenSilently, user: currentUser } = useAuth0();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [rankClicks, setRankClicks] = useState(reel.rankClicks?.length || 0);
  const [hasRankedUp, setHasRankedUp] = useState(false);

  const drifter = getUserData(reel);

  useEffect(() => {
    if (currentUser && reel.likes) {
      const myId = currentUser.sub || currentUser.id;
      setIsLiked(reel.likes.includes(myId));
      setHasRankedUp(reel.rankClicks?.includes(myId));
    }
  }, [currentUser, reel.likes, reel.rankClicks]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
        } else {
            videoRef.current?.pause();
        }
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
      await axios.post(`${API_URL}/api/posts/${reel._id}/like`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
    } catch (err) { 
        setIsLiked(isLiked);
        setLikesCount(reel.likes?.length || 0);
    }
  };

  const handleRankClick = async () => {
    if (hasRankedUp) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/${reel._id}/rank-up`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRankClicks(res.data.clicks);
        setHasRankedUp(true);
        if (res.data.rankUp) {
          toast.success("Milestone! Creator Rank Boosted! ⚡", {
            style: { background: '#00f2ff', color: '#000', fontWeight: 'bold' }
          });
        }
      }
    } catch (err) {
      toast.error("Signal weak. Try again.");
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <div className="h-[100dvh] w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef} 
        src={reel.mediaUrl || reel.media} 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onDoubleClick={handleDoubleTap}
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
      />

      <AnimatePresence>
        {showHeart && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1.5, opacity: 1 }} 
            exit={{ scale: 2, opacity: 0 }} 
            className="absolute z-[1010] pointer-events-none"
          >
            <Heart fill="#ff0050" className="text-[#ff0050]" size={100} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 z-[1005] pointer-events-none">
        {/* কন্টেন্ট বক্স - মোবাইলে ক্লিপিং এড়াতে প্যারিং এবং ফ্লেক্স অ্যাডজাস্ট করা হয়েছে */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 md:pb-20 flex items-end justify-between pointer-events-auto">
          
          <div className="flex-1 text-white pr-10">
            <div 
              className="flex items-center gap-3 mb-3 cursor-pointer group" 
              onClick={() => navigate(`/profile/${drifter.id}`)}
            >
              <div className="relative">
                <img 
                  src={drifter.avatar} 
                  className="w-10 h-10 rounded-full border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] object-cover" 
                  alt="" 
                />
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 border-2 border-black">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-[13px] tracking-tight text-white group-hover:text-cyan-400 transition-colors italic uppercase">
                  {drifter.name}
                </h4>
                <p className="text-[8px] text-cyan-400/60 font-black tracking-widest uppercase">NODE: {drifter.id?.slice(-8)}</p>
              </div>
            </div>
            
            <p className="text-[12px] leading-snug mb-4 line-clamp-2 font-medium text-gray-200 drop-shadow-lg">
              {reel.text || reel.content || "Neural transmission active..."}
            </p>
            
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full w-fit border border-white/10">
              <Music size={10} className="animate-pulse text-cyan-400" />
              <marquee className="text-[9px] text-cyan-500 font-black uppercase w-20">Neural Sync: {drifter.name}</marquee>
            </div>
          </div>

          {/* সাইড অ্যাকশন বাটনগুলো - একটু উপরে উঠানো হয়েছে যাতে নেভিগেশন বারে সমস্যা না হয় */}
          <div className="flex flex-col gap-5 items-center mb-2">
            
            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={handleRankClick}>
              <motion.div 
                whileTap={{ scale: 0.8 }}
                className={`p-2 rounded-full border-2 transition-all duration-500 ${
                  hasRankedUp 
                  ? "border-purple-500 bg-purple-500/20 text-purple-400 shadow-[0_0_15px_purple]" 
                  : "border-cyan-500/50 bg-black/40 text-cyan-400"
                }`}
              >
                <Award size={24} className={!hasRankedUp ? "animate-pulse" : ""} />
              </motion.div>
              <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-cyan-400" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(rankClicks % 10) * 10}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLike}>
              <div className="p-2 rounded-full bg-black/20 backdrop-blur-md active:scale-125 transition-transform">
                <Heart fill={isLiked ? "#ff0050" : "none"} className={isLiked ? "text-[#ff0050]" : "text-white"} size={28} />
              </div>
              <span className="text-[10px] font-black text-white drop-shadow-md">{likesCount}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsCommentOpen(true)}>
              <div className="p-2 rounded-full bg-black/20 backdrop-blur-md">
                <MessageCircle size={28} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-white drop-shadow-md">{reel.comments?.length || 0}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsShareOpen(true)}>
              <div className="p-2 rounded-full bg-black/20 backdrop-blur-md">
                <Share2 size={28} className="text-white" />
              </div>
              <span className="text-[8px] font-black uppercase text-white/70">Share</span>
            </div>
            
            <div className="mt-1 relative">
               <div className="w-10 h-10 rounded-full border-2 border-dashed border-cyan-500/50 p-0.5 animate-spin-slow">
                  <img src={drifter.avatar} className="w-full h-full rounded-full object-cover" alt="" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCommentOpen && <CommentSheet reel={reel} API_URL={API_URL} onClose={() => setIsCommentOpen(false)} />}
        {isShareOpen && <ShareSheet reel={reel} onClose={() => setIsShareOpen(false)} />}
      </AnimatePresence>

      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ReelsFeed;