import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Music, X, ArrowLeft, 
  UploadCloud, Cpu, Award, Eye, Lock, Mic, MicOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import toast from 'react-hot-toast';
import Webcam from "react-webcam";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
const AUTH_AUDIENCE = "https://onyx-drift-api.com";

/* ==========================================================
    ১. হেল্পার: ইউজার ডাটা রেজলভার
========================================================== */
const getUserData = (reel) => {
  const u = reel.user || reel.author || reel.userDetails || {};
  const name = reel.authorName || u.name || u.nickname || u.displayName || "Unknown Drifter";
  const avatar = reel.authorAvatar || u.avatar || u.picture || u.profilePicture || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1117&color=00f2ff&bold=true`;
  const id = String(reel.authorAuth0Id || u.auth0Id || u.userId || u.sub || "");
  return { name, avatar, id };
};

/* ==========================================================
    ২. রিল আইটেম (ReelItem)
========================================================== */
const ReelItem = ({ reel, index, isVoiceLiked }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { getAccessTokenSilently, user: currentUser } = useAuth0();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const drifter = getUserData(reel);

  useEffect(() => {
    if (currentUser && reel.likes) setIsLiked(reel.likes.includes(currentUser.sub));
  }, [currentUser, reel]);

  // ভয়েস কমান্ডের মাধ্যমে লাইক ট্রিগার
  useEffect(() => {
    if (isVoiceLiked) {
      handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  }, [isVoiceLiked]);

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

  const handleLike = async () => {
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience: AUTH_AUDIENCE } });
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
    <div id={`reel-${index}`} className="h-[100dvh] w-full snap-start relative bg-black flex items-center justify-center overflow-hidden border-b border-white/5">
      <video
        ref={videoRef} 
        id={`video-element-${index}`}
        src={reel.mediaUrl || reel.media} 
        loop playsInline muted
        onTimeUpdate={() => videoRef.current && setPlaybackProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)}
        className="absolute inset-0 w-full h-full object-cover"
        onDoubleClick={() => { if (!isLiked) handleLike(); setShowHeart(true); setTimeout(() => setShowHeart(false), 800); }}
      />

      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="absolute z-[1010] pointer-events-none">
            <Heart fill="#00f2ff" className="text-cyan-400" size={100} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-[1005] pointer-events-none p-6 flex flex-col justify-end pb-28">
        <div className="flex justify-between items-end pointer-events-auto">
          <div className="flex-1 pr-12">
             <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigate(`/profile/${drifter.id}`)}>
                <img src={drifter.avatar} className="w-12 h-12 rounded-full border-2 border-cyan-500 p-0.5 object-cover" alt="" />
                <div>
                   <h4 className="font-black text-sm text-white uppercase tracking-tighter">{drifter.name}</h4>
                   <span className="text-[9px] text-cyan-400 font-bold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">
                     NEURAL_ID: {drifter.id ? drifter.id.slice(-6) : "000000"}
                   </span>
                </div>
             </motion.div>
             <p className="text-sm text-gray-200 mb-4 line-clamp-2 font-medium">{reel.text}</p>
             <div className="flex items-center gap-2 text-cyan-400/80">
                <Music size={14} className="animate-spin-slow" />
                <span className="text-[10px] font-bold uppercase overflow-hidden whitespace-nowrap w-40">Original Signal Processing — {drifter.name}</span>
             </div>
          </div>

          <div className="flex flex-col gap-6">
            <ActionBtn icon={<Heart fill={isLiked ? "#00f2ff" : "none"} />} count={likesCount} active={isLiked} onClick={handleLike} />
            <ActionBtn icon={<MessageCircle />} count={reel.comments?.length || 0} />
            <ActionBtn icon={<Award />} count={reel.rankClicks?.length || 0} />
            <ActionBtn icon={<Share2 />} count="SIGNAL" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-cyan-500 shadow-[0_0_15px_#00f2ff] z-[1010]" style={{ width: `${playbackProgress}%` }} />
    </div>
  );
};

const ActionBtn = ({ icon, count, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group">
    <div className={`p-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 group-active:scale-75 transition-all ${active ? 'text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'text-white'}`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <span className="text-[10px] font-black text-white/70 uppercase">{count}</span>
  </button>
);

/* ==========================================================
    ৩. মেইন ফিড (ReelsFeed)
========================================================== */
const ReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNeuralLinkActive, setIsNeuralLinkActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isEyesOpen, setIsEyesOpen] = useState(true);
  const [isUserPresent, setIsUserPresent] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [voiceLikeTrigger, setVoiceLikeTrigger] = useState(0);

  const webcamRef = useRef(null);
  const cameraRef = useRef(null);
  const feedRef = useRef(null);
  const recognitionRef = useRef(null);
  const isProcessing = useRef(false);
  
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const scrollReel = useCallback((direction) => {
    if (isScrolling || !feedRef.current) return;
    setIsScrolling(true);
    const scrollAmount = window.innerHeight;
    feedRef.current.scrollBy({ top: direction === 'down' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    setTimeout(() => setIsScrolling(false), 1000);
  }, [isScrolling]);

  /* ---------------- Eye Tracking Sensor ---------------- */
  const onNeuralResults = useCallback((res) => {
    if (res?.multiFaceLandmarks?.[0]) {
      const face = res.multiFaceLandmarks[0];
      setIsUserPresent(true);
      const eyeDist = Math.abs(face[159].y - face[145].y);
      setIsEyesOpen(eyeDist > 0.012);

      if (eyeDist > 0.012 && !isScrolling) {
        const irisY = face[468].y;
        if (irisY > 0.53) scrollReel('down');
        if (irisY < 0.35) scrollReel('up');
      }
    } else {
      setIsUserPresent(false);
    }
  }, [scrollReel, isScrolling]);

  useEffect(() => {
    if (!isNeuralLinkActive) return;

    const faceMesh = new FaceMesh({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
    faceMesh.setOptions({ refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    faceMesh.onResults(onNeuralResults);

    if (webcamRef.current?.video) {
      cameraRef.current = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (isProcessing.current) return;
          isProcessing.current = true;
          try { await faceMesh.send({ image: webcamRef.current.video }); } catch(e) {}
          isProcessing.current = false;
        },
        width: 480, height: 360
      });
      cameraRef.current.start();
    }

    return () => {
      cameraRef.current?.stop();
      faceMesh.close();
    };
  }, [isNeuralLinkActive, onNeuralResults]);

  /* ---------------- Voice Control System ---------------- */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log("Voice Command:", command);

      if (command.includes("next") || command.includes("down")) scrollReel('down');
      if (command.includes("back") || command.includes("up")) scrollReel('up');
      if (command.includes("pause")) document.querySelectorAll('video').forEach(v => v.pause());
      if (command.includes("play")) document.querySelectorAll('video').forEach(v => v.play());
      if (command.includes("like")) setVoiceLikeTrigger(prev => prev + 1);
    };

    if (isVoiceActive) recognitionRef.current.start();
    else recognitionRef.current.stop();

    return () => recognitionRef.current?.stop();
  }, [isVoiceActive, scrollReel]);

  /* ---------------- Data Fetching ---------------- */
  useEffect(() => {
    const fetchReels = async () => {
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: AUTH_AUDIENCE } });
        const res = await axios.get(`${API_URL}/api/posts/neural-feed`, { headers: { Authorization: `Bearer ${token}` } });
        setReels(res.data.filter(p => p.media?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || p.mediaType === 'video' || p.media?.includes('video/upload')));
      } catch (err) { toast.error("Connection Interrupted"); }
      finally { setLoading(false); }
    };
    fetchReels();
  }, [getAccessTokenSilently]);

  const isLocked = isNeuralLinkActive && (!isUserPresent || !isEyesOpen);

  return (
    <div className="fixed inset-0 bg-black z-[2000]">
      {/* Privacy Guard Screen */}
      <AnimatePresence>
        {isLocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] backdrop-blur-3xl bg-black/50 flex items-center justify-center">
             <div className="text-center p-12 border border-cyan-500/20 rounded-[3rem] bg-black/80">
                <Lock className="text-red-500 w-16 h-16 mx-auto mb-4 animate-pulse" />
                <h2 className="text-red-500 font-black tracking-[0.4em] text-xs uppercase">Privacy Lock: Operator Absent</h2>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controller */}
      <div className="fixed top-0 left-0 right-0 z-[2110] p-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-cyan-500 hover:text-black transition-all">
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex gap-4">
           {/* Voice Toggle */}
           <button 
             onClick={() => setIsVoiceActive(!isVoiceActive)} 
             className={`p-3 rounded-full transition-all border ${isVoiceActive ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_25px_#00f2ff]' : 'bg-black/40 text-cyan-500 border-cyan-500/30'}`}
           >
              {isVoiceActive ? <Mic size={22} /> : <MicOff size={22} />}
           </button>

           {/* Eye Sensor Toggle */}
           <button 
             onClick={() => setIsNeuralLinkActive(!isNeuralLinkActive)} 
             className={`p-3 rounded-full transition-all border ${isNeuralLinkActive ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_25px_#00f2ff]' : 'bg-black/40 text-cyan-500 border-cyan-500/30'}`}
           >
              <Eye size={22} />
           </button>
        </div>
      </div>

      {/* Reels Main Feed */}
      <div ref={feedRef} className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar scroll-smooth bg-black">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-black">
             <div className="w-12 h-12 border-4 border-t-cyan-500 border-cyan-500/10 rounded-full animate-spin mb-4" />
             <p className="text-cyan-500 font-bold text-[10px] tracking-[0.5em] animate-pulse">CONNECTING NEURAL_FEED...</p>
          </div>
        ) : (
          reels.length > 0 ? (
            reels.map((reel, i) => (
              <ReelItem 
                key={reel._id} 
                reel={reel} 
                index={i} 
                isVoiceLiked={voiceLikeTrigger > 0} 
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Cpu size={40} className="mb-4 opacity-20" />
                <p className="text-[10px] uppercase tracking-widest">No Signals Detected</p>
            </div>
          )
        )}
      </div>

      {/* Hidden Webcam for Sensor Processing */}
      <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none">
        <Webcam 
          ref={webcamRef} 
          mirrored={true} 
          videoConstraints={{ width: 480, height: 360 }} 
        />
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ReelsFeed;