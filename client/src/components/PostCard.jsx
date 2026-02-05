import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, 
  FaPlay, FaPause, FaDownload, FaCertificate, FaShareAlt, FaExternalLinkAlt,
  FaRobot, FaBrain, FaTimes, FaMagic // FaSparkles সরিয়ে FaMagic যোগ করা হয়েছে
} from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import html2canvas from "html2canvas";

const PostCard = ({ post, onAction, onDelete, onUserClick }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isLiking, setIsLiking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const videoRef = useRef(null);
  const postRef = useRef(null);

  if (!post) return null;

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");
  const likesArray = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = user && likesArray.includes(user.sub);

  const formatPostDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "JUST NOW";
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return "ONLINE";
    }
  };

  const askAIAboutPost = async () => {
    if (showAIChat) {
      setShowAIChat(false);
      return;
    }

    setShowAIChat(true);
    setIsAiThinking(true);
    
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/posts/ai-analyze`, 
        { 
          text: post.text || "No text content", 
          authorName: post.authorName || "Unknown Drifter" 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiResponse(res.data.analysis);
    } catch (err) {
      console.error("AI Neural Link Error:", err);
      setAiResponse("Neural core connection timed out. Signal lost.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const generateShareCard = async () => {
    if (!postRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(postRef.current, {
        backgroundColor: "#020617",
        useCORS: true,
        scale: 2, 
        logging: false,
        borderRadius: 40,
        ignoreElements: (element) => element.tagName === "BUTTON" || element.classList.contains('video-controls') || element.classList.contains('ai-ignore'),
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Onyx_Post_${post._id?.slice(-4)}.png`;
      link.click();
    } catch (err) {
      console.error("Capture Error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (post.feedType === 'news') return; 
    const targetId = post.authorAuth0Id || post.author;
    if (onUserClick && targetId) onUserClick(targetId);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (post.feedType === 'news') return; 
    if (!isAuthenticated || isLiking) return;
    try {
      setIsLiking(true);
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onAction) onAction();
    } catch (err) { 
      console.error("Like Error:", err);
    } finally { 
      setIsLiking(false); 
    }
  };

  return (
    <motion.div 
      ref={postRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`bg-[#0a0f1e]/60 backdrop-blur-xl border-y border-white/[0.05] sm:border sm:rounded-[2rem] overflow-hidden mb-4 w-full transition-all group/card shadow-2xl relative ${post.feedType === 'news' ? 'border-cyan-500/20' : ''}`}
    >
      
      <button 
        onClick={askAIAboutPost}
        className="ai-ignore absolute top-4 right-14 p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 transition-all group/ai z-20"
        title="AI Analysis"
      >
        <FaBrain size={12} className={`${isAiThinking ? "animate-pulse" : "group-hover:rotate-12"} transition-transform`} />
      </button>

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className={`w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr cursor-pointer active:scale-90 transition-all shadow-lg ${post.feedType === 'news' ? 'from-cyan-400 to-blue-600' : 'from-cyan-500 to-purple-600'}`}
          >
            <img 
              src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName}`} 
              className="w-full h-full rounded-full object-cover bg-[#020617]" 
              alt="avatar" 
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="cursor-pointer" onClick={handleProfileClick}>
            <h4 className="font-bold text-white text-[14px] flex items-center gap-1 truncate max-w-[200px]">
              {post.authorName || 'Drifter'}
              {post.isVerified && <FaCertificate className="text-cyan-400 text-[10px]" />}
              {post.feedType === 'news' && <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 ml-2">NEWS</span>}
            </h4>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide">
              {formatPostDate(post.createdAt)}
            </p>
          </div>
        </div>

        {post.feedType !== 'news' && (user?.sub === post.author || user?.sub === post.authorAuth0Id) && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(window.confirm("Terminate Signal?")) onDelete(post._id); }} 
            className="p-2 text-gray-600 hover:text-rose-500 transition-all"
          >
            <FaTrashAlt size={12} />
          </button>
        )}
      </div>

      {post.text && (
        <div className="px-5 pb-3">
          <p className="text-gray-200 text-[15px] leading-relaxed font-medium">
            {post.text}
          </p>
          {post.feedType === 'news' && post.link && (
            <a 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 text-[11px] font-bold mt-3 hover:underline group"
            >
              READ FULL SIGNAL <FaExternalLinkAlt size={10} className="group-hover:translate-x-1 transition-transform" />
            </a>
          )}
        </div>
      )}

      <div className="px-3 pb-2"> 
        {post.media ? (
          <div className="relative rounded-[1.5rem] overflow-hidden bg-black/40 border border-white/5 group/media shadow-inner">
            {post.mediaType === "video" || post.mediaType === "reel" ? (
              <div className={post.mediaType === "reel" ? "aspect-[9/16] max-h-[500px] mx-auto" : "aspect-video"}>
                <video
                  ref={videoRef}
                  src={post.media}
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />
                <div 
                  onClick={togglePlay}
                  className={`absolute inset-0 flex items-center justify-center bg-black/20 video-controls transition-opacity ${isPlaying ? "opacity-0" : "opacity-100"}`}
                >
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20">
                    {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} className="ml-1" />}
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={post.media} 
                className="w-full object-cover max-h-[550px] min-h-[200px] bg-slate-900" 
                alt="Post media"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : null}
      </div>

      <div className="px-5 py-3 flex items-center justify-between border-t border-white/[0.03] mt-2">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2 transition-colors ${isLiked ? "text-rose-500" : "text-gray-500 hover:text-white"}`}
          >
            {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
            <span className="text-xs font-bold">{likesArray.length}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
            <FaRegComment size={18} />
            <span className="text-xs font-bold">{post.comments?.length || 0}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); generateShareCard(); }}
            disabled={isCapturing}
            className="p-2.5 text-gray-500 hover:text-cyan-400 rounded-full hover:bg-white/5 transition-all"
            title="Download Share Card"
          >
            <FaDownload size={14} className={isCapturing ? "animate-bounce text-cyan-500" : ""} />
          </button>
          
          <button className="p-2.5 text-gray-500 hover:text-purple-400 rounded-full hover:bg-white/5 transition-all">
            <FaShareAlt size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAIChat && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ai-ignore bg-cyan-500/5 border-t border-cyan-500/20 overflow-hidden"
          >
            <div className="p-5 relative">
              <button 
                onClick={() => setShowAIChat(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <FaTimes size={14} />
              </button>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <FaRobot size={16} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/60 flex items-center gap-2">
                    Neural Analyst <FaMagic className="animate-pulse" /> {/* FaSparkles এর বদলে FaMagic */}
                  </p>
                  {isAiThinking ? (
                    <div className="flex gap-1 py-2">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  ) : (
                    <p className="text-sm text-cyan-100/80 font-medium leading-relaxed italic">
                      "{aiResponse}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PostCard;