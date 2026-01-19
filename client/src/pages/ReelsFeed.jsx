import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, Send, X, ArrowLeft, Copy, Download, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';

// --- হেল্পার কম্পোনেন্ট: শেয়ার মেনু ---
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
      alert("Download failed.");
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/98 backdrop-blur-2xl p-6 rounded-t-[2rem] z-[2100] flex flex-col gap-6"
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

// --- হেল্পার কম্পোনেন্ট: কমেন্ট সেকশন ---
const CommentSheet = ({ reel, onClose, API_URL }) => {
  const [comments, setComments] = useState(reel.comments || []);
  const [newComment, setNewComment] = useState("");
  const { getAccessTokenSilently, user } = useAuth0();

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    const temp = { text: newComment, userName: user?.nickname || "User", userAvatar: user?.picture, createdAt: new Date().toISOString() };
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
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl h-[70vh] rounded-t-[2rem] z-[2000] flex flex-col"
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Feedback ({comments.length})</span>
        <X size={20} onClick={onClose} className="text-white/40 cursor-pointer" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((c, i) => (
          <div key={i} className="flex gap-3">
            <img src={c.userAvatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
            <div>
              <p className="text-[10px] font-bold text-cyan-400">@{c.userName}</p>
              <p className="text-sm text-white/90">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex gap-2 mb-4">
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type here..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-white outline-none" />
        <button onClick={handleSendComment} className="p-3 bg-cyan-500 rounded-full text-black"><Send size={18} /></button>
      </div>
    </motion.div>
  );
};

// --- মেইন ফিড কম্পোনেন্ট ---
const ReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/reels/all`); 
        setReels(response.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchReels();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[1000] overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      <button onClick={() => navigate(-1)} className="fixed top-6 left-4 z-[1100] p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"><ArrowLeft size={24} /></button>
      {loading ? (
        <div className="h-full flex items-center justify-center bg-black">
          <div className="w-10 h-10 border-4 border-t-cyan-500 border-white/10 rounded-full animate-spin"></div>
        </div>
      ) : (
        reels.map((reel) => <ReelItem key={reel._id} reel={reel} API_URL={API_URL} />)
      )}
    </div>
  );
};

// --- রিল আইটেম কম্পোনেন্ট ---
const ReelItem = ({ reel, API_URL }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
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
      await axios.put(`${API_URL}/api/posts/${reel._id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error("Like failed"); }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <div className="h-[100dvh] w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef} src={reel.media} loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onDoubleClick={handleDoubleTap}
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
      />

      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 2 }} exit={{ opacity: 0 }} className="absolute z-[1010] pointer-events-none">
            <Heart fill="#ff0050" className="text-[#ff0050]" size={80} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-[1005] pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-12 flex items-end justify-between pointer-events-auto">
          
          {/* ✅ ইউজার নেম এবং প্রোফাইল আইডি লজিক */}
          <div className="flex-1 text-white pr-10">
            <div className="flex items-center gap-3 mb-3" onClick={() => navigate(`/profile/${reel.authorAuth0Id}`)}>
              <img src={reel.authorAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-lg cursor-pointer" />
              <div className="flex flex-col">
                <h4 className="font-bold text-[14px] hover:underline cursor-pointer">@{reel.authorName}</h4>
                <span className="text-[8px] text-white/50 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">ID: {reel.authorAuth0Id?.substring(0, 10)}...</span>
              </div>
            </div>
            <p className="text-[13px] leading-tight mb-3 line-clamp-2">{reel.text}</p>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
              <Music size={12} className="animate-pulse" />
              <span className="text-[10px]">Original Audio - {reel.authorName}</span>
            </div>
          </div>

          {/* সাইড অ্যাকশন বাটন */}
          <div className="flex flex-col gap-5 items-center">
            <div className="flex flex-col items-center gap-1" onClick={handleLike}>
              <Heart fill={isLiked ? "#ff0050" : "none"} className={isLiked ? "text-[#ff0050]" : "text-white"} size={32} />
              <span className="text-[10px] font-bold">{likesCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1" onClick={() => setIsCommentOpen(true)}>
              <MessageCircle size={32} className="text-white" />
              <span className="text-[10px] font-bold">{reel.comments?.length || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1" onClick={() => setIsShareOpen(true)}>
              <Share2 size={32} className="text-white" />
              <span className="text-[10px] font-bold">Share</span>
            </div>
            <div className="w-9 h-9 rounded-full border-2 border-white/20 p-1 animate-spin-slow">
              <img src={reel.authorAvatar} className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCommentOpen && <CommentSheet reel={reel} API_URL={API_URL} onClose={() => setIsCommentOpen(false)} />}
        {isShareOpen && <ShareSheet reel={reel} onClose={() => setIsShareOpen(false)} />}
      </AnimatePresence>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ReelsFeed;