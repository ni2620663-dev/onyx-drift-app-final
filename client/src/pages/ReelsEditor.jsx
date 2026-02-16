import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Play, Sparkles, Send, Wand2, Layers } from "lucide-react";
import toast from 'react-hot-toast';

// সাব-কম্পোনেন্ট ইমপোর্ট
// সঠিক ইমপোর্ট পাথ (Correct Import Path)
import Sidebar from "../components/Editor/Sidebar";
import Timeline from "../components/Editor/Timeline";
import Modals from "../components/Editor/Modals";
import Marketplace from "../components/Editor/Marketplace";
const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

const TikTokEditor = () => {
  const { getAccessTokenSilently, user } = useAuth0();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [renderProgress, setRenderProgress] = useState(0);
  
  // New States for Multi-Clip, AI and Marketplace
  const [aiPrompt, setAiPrompt] = useState("");
  const [clips, setClips] = useState([]); 
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false); // Marketplace স্টেট

  const [editData, setEditData] = useState({
    filters: { 
      brightness: 100, contrast: 100, saturate: 100, 
      exposure: 0, shadows: 0, highlights: 0, 
      blur: 0, temperature: 0, tint: 0, vibrance: 100 
    },
    aiAutoEffects: 'none', 
    playbackSpeed: 1,
    layers: [],
    aspectRatio: "9:16",
    rotation: 0,
    isFlipped: false,
    shareToMarketplace: false,
    removeBackground: false 
  });

  // Handle Multi-Clip Upload
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newClips = files.map(file => ({
        id: Date.now() + Math.random(),
        file: file,
        src: URL.createObjectURL(file)
      }));
      
      setClips(prev => [...prev, ...newClips]);
      setVideoFile(files[0]); 
      setVideoSrc(newClips[0].src);
      toast.success(`${files.length} Source(s) Injected!`);
    }
  };

  // --- AI Feature: Voiceover Generation ---
  const generateVoiceover = async (text) => {
    if (!text) return toast.error("Enter text for voiceover!");
    setIsAiProcessing(true);
    const vToast = toast.loading("Synthesizing Neural Voice...");

    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/ai/generate-voiceover`, 
        { text: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newLayer = { 
        id: Date.now(), 
        type: 'audio', 
        content: 'AI Voiceover', 
        url: res.data.audioUrl 
      };
      setEditData(p => ({ ...p, layers: [...p.layers, newLayer] }));
      toast.success("Voiceover Synced to Timeline!", { id: vToast });
    } catch (err) {
      toast.error("Voice Synthesis Failed", { id: vToast });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // --- Marketplace: Apply Template ---
  const applyTemplate = (templateProjectData) => {
    setEditData(prev => ({
      ...prev,
      filters: templateProjectData.filters || prev.filters,
      layers: templateProjectData.layers || prev.layers,
      aiAutoEffects: templateProjectData.aiAutoEffects || 'none'
    }));
    toast.success("Neural Template Synchronized!");
  };

  // --- AI Feature: Merge Clips ---
  const mergeAllClips = async () => {
    if (clips.length < 2) return toast.error("Need at least 2 clips to merge!");
    setIsAiProcessing(true);
    const mToast = toast.loading("Merging Neural Strands...");

    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/ai/merge-clips`, 
        { videoPaths: clips.map(c => c.src) }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVideoSrc(res.data.videoUrl);
      toast.success("Sequence Merged Successfully!", { id: mToast });
    } catch (err) {
      toast.error("Merge Operation Failed", { id: mToast });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // --- AI Command: Text-to-Edit Logic ---
  const applyAICommand = async () => {
    if (!aiPrompt) return toast.error("Enter a command first!");
    setIsAiProcessing(true);
    const loadingToast = toast.loading("AI is analyzing your command...");
    
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/ai/process-command`, 
        { command: aiPrompt, currentFilters: editData.filters },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditData(prev => ({ ...prev, filters: res.data.newFilters }));
      toast.success("AI Visual Refactoring Complete!", { id: loadingToast });
      setAiPrompt("");
    } catch (err) {
      toast.error("AI Neural Link Failed", { id: loadingToast });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // --- AI Feature: Text-to-Video Generation ---
  const generateAIVideo = async () => {
    if (!aiPrompt) return toast.error("Describe the video you want to generate!");
    setIsAiProcessing(true);
    const genToast = toast.loading("Synthesizing AI Video...");

    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/ai/generate-video`, 
        { prompt: aiPrompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVideoSrc(res.data.videoUrl); 
      toast.success("AI Video Manifested!", { id: genToast });
      setAiPrompt("");
    } catch (err) {
      toast.error("Generation Failed", { id: genToast });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const triggerRemoveBG = async () => {
    if (!videoFile) return toast.error("Please upload a video first!");
    setIsAiProcessing(true);
    toast.loading("AI is removing background...");
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("video", videoFile);
      const res = await axios.post(`${API_URL}/api/ai/remove-background`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideoSrc(res.data.processedVideo);
      toast.dismiss();
      toast.success("Background Removed!");
    } catch (err) {
      toast.dismiss();
      toast.error("AI Removal Failed!");
    } finally {
      setIsAiProcessing(false);
    }
  };

  // --- Viral Score Handler ---
  const checkViralPotential = async () => {
    setIsAiProcessing(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/ai/analyze-viral-score`, {
        videoData: editData,
        currentTitle: "My Awesome Reel"
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast(`Viral Score: ${res.data.analysis.score}% \nTip: ${res.data.analysis.tips[0]}`, {
        icon: '🚀',
        duration: 5000
      });
    } catch (err) {
      toast.error("Prediction Engine Offline");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const transmitToCloud = async () => {
    if (!videoFile && !videoSrc) return toast.error("Injection Required!");
    setIsUploading(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      if(videoFile) formData.append("media", videoFile);
      formData.append("editInstructions", JSON.stringify({ ...editData, author: user?.nickname }));
      await axios.post(`${API_URL}/api/posts/process`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (p) => setRenderProgress(Math.round((p.loaded * 100) / p.total))
      });
      toast.success("Transmission Complete!");
      navigate('/reels');
    } catch (err) { toast.error("Transmission Failed!"); }
    finally { setIsUploading(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      <style>{`
        @keyframes neural-glitch {
          0% { transform: translate(0); filter: hue-rotate(0deg); }
          20% { transform: translate(-3px, 2px); filter: contrast(1.5); }
          40% { transform: translate(3px, -1px); filter: hue-rotate(180deg); }
          100% { transform: translate(0); }
        }
        .animate-glitch { animation: neural-glitch 0.2s infinite linear; }
      `}</style>

      {/* Sidebar with Marketplace & Viral Score Trigger */}
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        editData={editData} 
        setEditData={setEditData} 
        predictViralScore={checkViralPotential} 
        setIsMarketplaceOpen={setIsMarketplaceOpen}
      />

      <main className="flex-1 flex flex-col h-full relative">
        <header className="p-4 md:p-8 flex justify-between items-center z-50">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all text-zinc-400">
            <ArrowLeft size={20} />
          </button>

          {/* AI COMMAND BAR */}
          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
            <div className="bg-zinc-900/50 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 focus-within:border-cyan-500/50 transition-all">
              <Sparkles size={16} className="text-cyan-500" />
              <input 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Command AI: 'Make it cinematic' or 'Create a space video'..."
                className="bg-transparent border-none outline-none text-[11px] w-full placeholder:text-zinc-600"
              />
              <div className="flex gap-1">
                 <button onClick={applyAICommand} title="Apply Edit" className="p-1.5 hover:bg-white/10 rounded-full text-cyan-500 transition-colors"><Wand2 size={14}/></button>
                 <button onClick={generateAIVideo} title="Generate Video" className="p-1.5 bg-cyan-500 text-black rounded-full hover:scale-110 transition-transform"><Send size={14}/></button>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {clips.length > 1 && (
              <button onClick={mergeAllClips} className="p-3 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full hover:bg-cyan-500 hover:text-black transition-all">
                <Layers size={18} />
              </button>
            )}
            <button onClick={triggerRemoveBG} className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-[10px] font-black uppercase hover:bg-purple-500 hover:text-white transition-all">
              AI Remove BG
            </button>
            <button onClick={transmitToCloud} className="px-6 py-3 bg-cyan-500 text-black font-black uppercase text-xs rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all">
              Transmit
            </button>
          </div>
        </header>

        {/* Viewport Engine */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {videoSrc ? (
            <div 
              className={`relative rounded-2xl overflow-hidden bg-black shadow-2xl transition-all ${editData.aiAutoEffects === 'glitch' ? 'animate-glitch' : ''}`}
              style={{ aspectRatio: "9/16", maxHeight: "80%", transform: `scaleX(${editData.isFlipped ? -1 : 1})` }}
            >
              <video
                ref={videoRef} src={videoSrc} loop playsInline className="w-full h-full object-contain"
                style={{ filter: `brightness(${editData.filters.brightness}%) contrast(${editData.filters.contrast}%) saturate(${editData.filters.saturate}%) blur(${editData.filters.blur}px)` }}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration)}
                onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
              />
              {editData.layers.map(layer => (
                <motion.div key={layer.id} drag className="absolute z-50 cursor-grab active:cursor-grabbing" style={{ top: '30%', left: '40%' }}>
                  {layer.type === 'sticker' ? (
                    <div className="text-6xl drop-shadow-2xl select-none">{layer.content}</div>
                  ) : (
                    <div className="bg-amber-400 text-black px-4 py-1 font-black text-[10px] uppercase italic rounded-sm shadow-xl">{layer.content}</div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div onClick={() => fileInputRef.current.click()} className="flex flex-col items-center cursor-pointer group">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border-2 border-dashed border-cyan-500/20 group-hover:border-cyan-500 transition-all">
                <Plus size={32} className="text-cyan-500" />
              </div>
              <p className="mt-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest">Inject Neural Source</p>
            </div>
          )}
        </div>

        <Timeline 
          currentTime={currentTime} 
          duration={duration} 
          videoRef={videoRef} 
          isPlaying={isPlaying} 
          setEditData={setEditData} 
          setVideoSrc={setVideoSrc} 
          clips={clips} 
        />
      </main>

      {/* Modals for Editing Tools */}
      <AnimatePresence>
        {activeMenu && (
          <Modals 
            activeMenu={activeMenu} setActiveMenu={setActiveMenu} editData={editData} setEditData={setEditData} 
            updateSpeed={(s) => { setEditData(p => ({ ...p, playbackSpeed: s })); if(videoRef.current) videoRef.current.playbackRate = s; }}
            addSticker={(emoji) => {
               const newLayer = { id: Date.now(), type: 'sticker', content: emoji };
               setEditData(p => ({ ...p, layers: [...p.layers, newLayer] }));
               toast.success("Sticker Synced!");
            }}
            generateViralHook={() => {
              const hooks = ["Wait for the end!", "POV: You're in 2026", "Mind-blown 🤯"];
              const newLayer = { id: Date.now(), type: 'text', content: hooks[Math.floor(Math.random() * hooks.length)] };
              setEditData(p => ({ ...p, layers: [...p.layers, newLayer] }));
              toast.success("Viral Hook Injected!");
            }}
            generateVoiceover={generateVoiceover} 
          />
        )}
      </AnimatePresence>

      {/* Template Marketplace Modal */}
      <Marketplace 
        isOpen={isMarketplaceOpen} 
        onClose={() => setIsMarketplaceOpen(false)} 
        applyTemplate={applyTemplate} 
      />

      <input ref={fileInputRef} type="file" hidden accept="video/*" multiple onChange={handleUpload} />
    </div>
  );
};

export default TikTokEditor;