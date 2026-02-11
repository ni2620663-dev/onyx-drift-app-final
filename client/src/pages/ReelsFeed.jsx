import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Music, Send, X, ArrowLeft, 
  Copy, Download, MessageSquare, Award, UploadCloud, Cpu 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import toast from 'react-hot-toast';

/* ==========================================================
    ১. হেল্পার ফাংশন (User Data Resolver)
========================================================== */
const getUserData = (reel) => {
  const u = reel.user || reel.author || {};
  const name = u.name || reel.authorName || u.nickname || "Drifter";
  const avatar = u.avatar || u.picture || reel.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1117&color=00f2ff&bold=true`;
  const id = u.auth0Id || u.userId || reel.authorAuth0Id || reel.author || "";
  return { name, avatar, id };
};

/* ==========================================================
    ২. ভিডিও আপলোড কম্পোনেন্ট (Neural Uplink)
========================================================== */
const VideoUploadModal = ({ isOpen, onClose, onUploadSuccess, API_URL }) => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('video/')) {
      setFile(selected);
    } else {
      toast.error("Invalid neural signal. Please select a video.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("video", file); // ব্যাকএন্ডে 'video' ফিল্ড নাম থাকতে হবে
    formData.append("text", caption);

    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/reels/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      toast.success("Neural Signal Uplinked Successfully!");
      onUploadSuccess();
      onClose();
    } catch (err) {
      toast.error("Uplink Interrupted");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[4000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-zinc-900 border border-cyan-500/30 w-full max-w-md rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/10">
                <motion.div className="h-full bg-cyan-500 shadow-[0_0_10px_#00f2ff]" style={{ width: `${uploadProgress}%` }} />
            </div>

            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X /></button>
            <h2 className="text-xl font-black text-cyan-400 uppercase tracking-tighter mb-6 flex items-center gap-2">
              <UploadCloud size={24} /> Neural Uplink
            </h2>

            {!file ? (
              <label className="border-2 border-dashed border-white/10 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all">
                <Cpu size={40} className="text-zinc-600 mb-2 animate-pulse" />
                <span className="text-xs text-zinc-500 uppercase font-bold">Drop Video Signal</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-xs text-cyan-200 font-mono truncate">{file.name}</div>
                <textarea 
                  placeholder="Enter caption for this signal..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500/50 h-24"
                  onChange={(e) => setCaption(e.target.value)}
                />
                <button 
                  disabled={isUploading}
                  onClick={handleUpload}
                  className="w-full py-4 bg-cyan-500 text-black font-black uppercase rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
                >
                  {isUploading ? `Uplinking ${uploadProgress}%` : "Initiate Transmission"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ==========================================================
    ৩. রিল আইটেম (With Playback Progress Bar)
========================================================== */
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
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const drifter = getUserData(reel);

  // লাইক এবং র‍্যাংক স্ট্যাটাস চেক
  useEffect(() => {
    if (currentUser) {
      const myId = currentUser.sub || currentUser.id;
      setIsLiked(reel.likes?.includes(myId));
      setHasRankedUp(reel.rankClicks?.includes(myId));
    }
  }, [currentUser, reel]);

  // ভিডিও প্রগ্রেস হ্যান্ডেলার
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setPlaybackProgress(progress);
    }
  };

  // ইনটারসেকশন অবজারভার (অটো প্লে/পজ)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
          if (videoRef.current) videoRef.current.currentTime = 0;
        }
      });
    }, { threshold: 0.6 });
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLike = async (e) => {
    if(e) e.stopPropagation();
    try {
      const token = await getAccessTokenSilently();
      const newStatus = !isLiked;
      setIsLiked(newStatus);
      setLikesCount(prev => newStatus ? prev + 1 : prev - 1);
      await axios.post(`${API_URL}/api/posts/${reel._id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { 
      setIsLiked(!isLiked);
      setLikesCount(reel.likes?.length || 0);
    }
  };

  return (
    <div className="h-[100dvh] w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
      {/* ভিডিও প্লেব্যাক প্রগ্রেস বার (Top) */}
      <div className="absolute top-0 left-0 w-full h-[2px] z-[2100] bg-white/10">
        <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00f2ff]" style={{ width: `${playbackProgress}%` }} />
      </div>

      <video
        ref={videoRef} 
        src={reel.mediaUrl || reel.media} 
        loop playsInline muted
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover"
        onDoubleClick={() => { if (!isLiked) handleLike(); setShowHeart(true); setTimeout(() => setShowHeart(false), 800); }}
        onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
      />

      {/* ডাবল ট্যাপ হার্ট অ্যানিমেশন */}
      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute z-[1010] pointer-events-none">
            <Heart fill="#ff0050" className="text-[#ff0050] drop-shadow-[0_0_20px_rgba(255,0,80,0.8)]" size={100} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 z-[1005] pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-20 flex items-end justify-between pointer-events-auto">
          <div className="flex-1 text-white pr-12">
            <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigate(`/profile/${drifter.id}`)}>
              <div className="relative">
                <img src={drifter.avatar} className="w-11 h-11 rounded-full border-2 border-cyan-500 object-cover" alt="" />
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 border-2 border-black animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase italic tracking-tighter">{drifter.name}</h4>
                <p className="text-[8px] text-cyan-400 font-bold tracking-widest">SIGNAL_ID: {reel._id.slice(-6)}</p>
              </div>
            </div>
            <p className="text-[13px] leading-snug mb-5 font-medium text-gray-100 line-clamp-2">{reel.text}</p>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full w-fit border border-white/10">
              <Music size={12} className="animate-spin-slow text-cyan-400" />
              <marquee className="text-[10px] text-cyan-400 font-black uppercase w-24">Original Audio - {drifter.name}</marquee>
            </div>
          </div>

          {/* সাইড অ্যাকশন বাটন */}
          <div className="flex flex-col gap-6 items-center">
            <ActionIcon icon={<Award size={26} />} count={rankClicks} color={hasRankedUp ? "text-purple-400" : "text-white"} active={hasRankedUp} />
            <div onClick={handleLike}><ActionIcon icon={<Heart fill={isLiked ? "#ff0050" : "none"} size={30} />} count={likesCount} active={isLiked} color={isLiked ? "text-[#ff0050]" : "text-white"} /></div>
            <div onClick={() => setIsCommentOpen(true)}><ActionIcon icon={<MessageCircle size={30} />} count={reel.comments?.length || 0} /></div>
            <div onClick={() => setIsShareOpen(true)}><ActionIcon icon={<Share2 size={30} />} count="Share" /></div>
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-cyan-500/40 p-0.5 animate-spin-slow">
               <img src={drifter.avatar} className="w-full h-full rounded-full object-cover grayscale" alt="" />
            </div>
          </div>
        </div>
      </div>
      
      {/* শিট কম্পোনেন্টগুলো এখানে আসবে (CommentSheet, ShareSheet - আগের কোড অনুযায়ী) */}
    </div>
  );
};

const ActionIcon = ({ icon, count, color = "text-white", active = false }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`p-2.5 rounded-full bg-black/30 backdrop-blur-md transition-all ${active ? 'scale-110' : ''}`}>
      <span className={color}>{icon}</span>
    </div>
    <span className="text-[11px] font-black text-white">{count}</span>
  </div>
);

/* ==========================================================
    ৪. মেইন ফিড (ReelsFeed)
========================================================== */
const ReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  const fetchReels = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts/neural-feed`); 
      const reelsOnly = response.data.filter(post => post.media && post.media.match(/\.(mp4|webm|mov)$/i));
      setReels(reelsOnly);
    } catch (err) { 
      toast.error("Signal Lost");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReels(); }, []);

  return (
    <div className="fixed inset-0 bg-black z-[2000] overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {/* টপ নেভিগেশন */}
      <div className="fixed top-6 left-0 right-0 z-[2110] px-4 flex justify-between items-center pointer-events-none">
        <button onClick={() => navigate(-1)} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 pointer-events-auto active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => setIsUploadModalOpen(true)} className="p-3 bg-cyan-500 rounded-full text-black shadow-[0_0_20px_#00f2ff] pointer-events-auto active:scale-90 transition-all">
          <UploadCloud size={20} />
        </button>
      </div>
      
      {loading ? (
        <div className="h-full flex items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-t-cyan-500 border-cyan-500/20 rounded-full animate-spin" />
        </div>
      ) : (
        reels.map((reel) => <ReelItem key={reel._id} reel={reel} API_URL={API_URL} />)
      )}

      <VideoUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={fetchReels} 
        API_URL={API_URL} 
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ReelsFeed;