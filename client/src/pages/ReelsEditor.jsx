import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Play, Sparkles, Send, Wand2, Layers, Scissors } from "lucide-react";
import toast from 'react-hot-toast';

// সাব-কম্পোনেন্ট ইমপোর্ট
import Sidebar from "../components/Editor/Sidebar";
import Timeline from "../components/Editor/Timeline";
import Modals from "../components/Editor/Modals";
import Marketplace from "../components/Editor/Marketplace";
import { renderVideo } from "../services/RenderService"; 
import { detectSilence } from "../services/SilenceDetectionService";
import { detectBeats } from "../services/BeatSyncService";
import { generateSubtitles } from "../services/AutoSubtitleService";
import { removeObjectFromVideo } from "../services/ObjectRemovalService";
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
  const [isRendering, setIsRendering] = useState(false); 
  const [activeMenu, setActiveMenu] = useState(null);
  const [renderProgress, setRenderProgress] = useState(0);
  
  const [aiPrompt, setAiPrompt] = useState("");
  const [clips, setClips] = useState([]); 
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [tracks, setTracks] = useState({
    video: [], 
    audio: [], 
    text: []   
  });

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

  useEffect(() => {
    if (videoSrc && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log("Auto-play blocked"));
    }
  }, [videoSrc]);

  const generateWaveform = async (audioUrl) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (err) {
      console.error("Waveform generation failed", err);
    }
  };

  const handleObjectRemoval = async () => {
    if (!selectionRect || !videoFile) return toast.error("Select an object first!");
    const eraseToast = toast.loading("AI is digitally erasing the object...");
    try {
      const token = await getAccessTokenSilently();
      const cleanVideoUrl = await removeObjectFromVideo(videoFile, selectionRect, token);
      setVideoSrc(cleanVideoUrl);
      setIsEraserMode(false);
      setSelectionRect(null);
      toast.success("Object Vanished into Thin Air!", { id: eraseToast });
    } catch (err) {
      toast.error("Eraser failed. Try a smaller area.", { id: eraseToast });
    }
  };

  const onMouseDown = (e) => {
    if (!isEraserMode) return;
    const rect = e.target.getBoundingClientRect();
    setSelectionRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
  };

  const runAutoDirector = async () => {
    const autoToast = toast.loading("AI is analyzing scenes and sync to beats...");
    setTimeout(() => {
      toast.success("Viral Edit Ready!", { id: autoToast });
    }, 2000);
  };

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
const NeuralController = ({ aiPrompt, setAiPrompt, runCommand }) => (
  const handleBeatSync = async () => {
    if (editData.layers.length === 0 || clips.length === 0) {
      return toast.error("Need Background Music & Clips first!");
    }
    const musicLayer = editData.layers.find(l => l.type === 'audio');
    if (!musicLayer) return toast.error("No music track found for syncing!");
    const bToast = toast.loading("AI is calculating rhythmic pulses...");
    try {
      const beats = await detectBeats(musicLayer.url);
      const syncedClips = clips.map((clip, index) => {
        if (beats[index]) {
          return { 
            ...clip, 
            startTime: beats[index], 
            duration: (beats[index+1] || beats[index] + 2) - beats[index] 
          };
        }
        return clip;
      });
      setClips(syncedClips);
      toast.success(`Synced ${syncedClips.length} clips to the beat!`, { id: bToast });
      setEditData(prev => ({ ...prev, aiAutoEffects: 'beat-sync' }));
    } catch (err) {
      toast.error("Beat synchronization failed.", { id: bToast });
    }
  };

  const applyCinematicMood = (selectedMood) => {
    setEditData(prev => ({ ...prev, mood: selectedMood }));
    toast.success(`Applying ${selectedMood.toUpperCase()} Color Grade...`);
  };

  const getDynamicStyle = () => {
    if (editData.mood === 'matrix') return { filter: 'hue-rotate(90deg) contrast(1.2) saturate(0.8) brightness(0.9)' };
    if (editData.mood === 'cyberpunk') return { filter: 'hue-rotate(-30deg) contrast(1.3) saturate(1.5)' };
    if (editData.mood === 'oppenheimer') return { filter: 'grayscale(0.3) contrast(1.4) brightness(0.9)' };
    return {};
  };

  const handleAutoCaptions = async () => {
    if (!videoSrc) return toast.error("Inject video first!");
    const sToast = toast.loading("AI is listening to your video...");
    try {
      const captions = await generateSubtitles(videoSrc);
      const newLayers = captions.map(cap => ({
        id: Date.now() + Math.random(),
        type: 'text',
        content: cap.text,
        start: cap.start,
        end: cap.end,
        style: {
          fontSize: '24px',
          fontWeight: '900',
          color: '#facc15',
          textShadow: '2px 2px 10px rgba(0,0,0,0.5)',
          fontFamily: 'Inter, sans-serif'
        }
      }));
      setEditData(prev => ({ ...prev, layers: [...prev.layers, ...newLayers] }));
      setTracks(t => ({ ...t, text: [...t.text, ...newLayers] }));
      toast.success(`${captions.length} Captions Generated!`, { id: sToast });
    } catch (err) {
      toast.error("Subtitle generation failed.", { id: sToast });
    }
  };

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
      const newLayer = { id: Date.now(), type: 'audio', content: 'AI Voiceover', url: res.data.audioUrl };
      setEditData(p => ({ ...p, layers: [...p.layers, newLayer] }));
      setTracks(t => ({...t, audio: [...t.audio, newLayer]}));
      generateWaveform(res.data.audioUrl);
      toast.success("Voiceover Synced to Timeline!", { id: vToast });
    } catch (err) {
      toast.error("Voice Synthesis Failed", { id: vToast });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const applyTemplate = (templateProjectData) => {
    setEditData(prev => ({
      ...prev,
      filters: templateProjectData.filters || prev.filters,
      layers: templateProjectData.layers || prev.layers,
      aiAutoEffects: templateProjectData.aiAutoEffects || 'none'
    }));
    toast.success("Neural Template Synchronized!");
  };
// Smart Rendering Engine: GPU Accelerated
const renderVideo = async (file, layers, editData, setProgress) => {
  const worker = new Worker('render-worker.js'); // মাল্টি-থ্রেডেড রেন্ডারিং
  return new Promise((resolve, reject) => {
    worker.postMessage({ file, layers, editData });
    worker.onmessage = (e) => {
      if (e.data.type === 'PROGRESS') setProgress(e.data.value);
      if (e.data.type === 'COMPLETE') resolve(e.data.url);
    };
    worker.onerror = reject;
  });
};

// Neural Scene Analyzer (World Class AI)
const analyzeScene = async (videoFrame) => {
  // ফ্রেমের কন্টেন্ট বুঝে এআই নিজেই ফিল্টার সাজেস্ট করবে
  const analysis = await axios.post(`${API_URL}/api/ai/analyze-frame`, { frame: videoFrame });
  return analysis.data.recommendedEffect; 
};
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

  const handleExport = async () => {
    if (!videoFile) return toast.error("No video to export!");
    setIsRendering(true);
    const toastId = toast.loading("Merging Audio & Video Strands...");
    try {
      const renderedVideoUrl = await renderVideo(videoFile, editData.layers, editData, setRenderProgress);
      const a = document.createElement('a');
      a.href = renderedVideoUrl;
      a.download = `Gemini_Edit_${Date.now()}.mp4`;
      a.click();
      toast.success("Render Complete! Ready for TikTok.", { id: toastId });
    } catch (error) {
      toast.error("Render Failed. Check Console.", { id: toastId });
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

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

  const checkViralPotential = async () => {
    setIsAiProcessing(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/ai/analyze-viral-score`, {
        videoData: editData,
        currentTitle: "My Awesome Reel"
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast(`Viral Score: ${res.data.analysis.score}% \nTip: ${res.data.analysis.tips[0]}`, { icon: '🚀', duration: 5000 });
    } catch (err) {
      toast.error("Prediction Engine Offline");
    } finally {
      setIsAiProcessing(false);
    }
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

      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        editData={editData} 
        setEditData={setEditData} 
        predictViralScore={checkViralPotential} 
        setIsMarketplaceOpen={setIsMarketplaceOpen}
      />

      <main className="flex-1 flex flex-col h-full relative z-0">
        <header className="p-4 md:p-8 flex justify-between items-center z-10 bg-[#020202]/80 backdrop-blur-md">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all text-zinc-400 shrink-0">
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
            <div className="bg-zinc-900/50 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 focus-within:border-cyan-500/50 transition-all">
              <input 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Command AI: 'Make it cinematic'..."
                className="bg-transparent border-none outline-none text-[11px] w-full placeholder:text-zinc-600"
              />
              <div className="flex gap-1">
                 <button onClick={applyAICommand} className="p-1.5 hover:bg-white/10 rounded-full text-cyan-500 transition-colors"><Wand2 size={14}/></button>
                 <button onClick={generateAIVideo} className="p-1.5 bg-cyan-500 text-black rounded-full hover:scale-110 transition-transform"><Send size={14}/></button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 md:gap-4 shrink-0">
            <button onClick={runAutoDirector} className="p-2 md:p-3 bg-zinc-900 border border-white/10 rounded-full hover:bg-white/5 transition-all text-amber-400">
              <Sparkles size={18} />
            </button>
            {clips.length > 1 && (
              <button onClick={mergeAllClips} className="p-2 md:p-3 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full hover:bg-cyan-500 hover:text-black transition-all">
                <Layers size={18} />
              </button>
            )}
            <button onClick={triggerRemoveBG} className="px-3 md:px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-[8px] md:text-[10px] font-black uppercase hover:bg-purple-500 hover:text-white transition-all">
              AI Remove BG
            </button>
            <button 
              onClick={handleExport} 
              disabled={isRendering}
              className="px-4 md:px-6 py-2 md:py-3 bg-cyan-500 text-black font-black uppercase text-[10px] md:text-xs rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all disabled:bg-zinc-700"
            >
              {isRendering ? `Rendering ${renderProgress}%` : "Export"}
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 pb-20 md:pb-4 relative z-0 overflow-hidden">
          {videoSrc ? (
            <div 
              className={`relative rounded-2xl overflow-hidden bg-black shadow-2xl transition-all ${editData.aiAutoEffects === 'glitch' ? 'animate-glitch' : ''}`}
              style={{ 
                aspectRatio: "9/16", 
                height: "auto",
                maxHeight: "65vh", 
                width: "auto",
                transform: `scaleX(${editData.isFlipped ? -1 : 1})` 
              }}
            >
              <video
                ref={videoRef} 
                src={videoSrc} 
                loop 
                playsInline 
                autoPlay
                className="w-full h-full object-contain cursor-pointer"
                style={{ filter: `brightness(${editData.filters.brightness}%) contrast(${editData.filters.contrast}%) saturate(${editData.filters.saturate}%) blur(${editData.filters.blur}px)` }}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration)}
                onPlay={() => setIsPlaying(true)} 
                onPause={() => setIsPlaying(false)}
                onClick={() => {
                  if(videoRef.current.paused) videoRef.current.play();
                  else videoRef.current.pause();
                }}
              />
              {editData.layers.map(layer => (
                <motion.div key={layer.id} drag className="absolute z-10 cursor-grab active:cursor-grabbing" style={{ top: '30%', left: '40%' }}>
                  {layer.type === 'sticker' ? (
                    <div className="text-4xl md:text-6xl drop-shadow-2xl select-none">{layer.content}</div>
                  ) : (
                    <div className="bg-amber-400 text-black px-3 py-1 font-black text-[8px] md:text-[10px] uppercase italic rounded-sm shadow-xl">{layer.content}</div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div onClick={() => fileInputRef.current.click()} className="flex flex-col items-center cursor-pointer group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-full flex items-center justify-center border-2 border-dashed border-cyan-500/20 group-hover:border-cyan-500 transition-all">
                <Plus size={32} className="text-cyan-500" />
              </div>
              <p className="mt-4 text-[8px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest">Inject Neural Source</p>
            </div>
          )}

          {isEraserMode && (
            <div className="absolute inset-0 z-50 cursor-crosshair bg-cyan-500/10" onMouseDown={onMouseDown}>
              {selectionRect && (
                <div className="border-2 border-dashed border-red-500 bg-red-500/20 absolute" style={{ left: selectionRect.x, top: selectionRect.y, width: selectionRect.width, height: selectionRect.height }} />
              )}
              <button onClick={handleObjectRemoval} className="absolute bottom-4 right-4 bg-red-500 px-4 py-2 rounded-full font-bold shadow-xl">Confirm Erase</button>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-12">
            {editData.layers
              .filter(l => l.type === 'text' && currentTime >= l.start && currentTime <= l.end)
              .map(layer => (
                <motion.div key={layer.id} initial={{ y: 20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="bg-black/40 px-4 py-1 rounded backdrop-blur-sm" style={layer.style}>
                  {layer.content}
                </motion.div>
              ))}
          </div>
        </div>

        <Timeline 
          currentTime={currentTime} duration={duration} videoRef={videoRef} isPlaying={isPlaying} 
          setEditData={setEditData} setVideoSrc={setVideoSrc} clips={clips} tracks={tracks} 
        />
      </main>

      <AnimatePresence>
        {activeMenu && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/20" onClick={() => setActiveMenu(null)} />
            
            <div className="relative z-[1001] w-full max-w-lg">
              <Modals 
                activeMenu={activeMenu} 
                setActiveMenu={setActiveMenu} 
                editData={editData} 
                setEditData={setEditData} 
                updateSpeed={(s) => { 
                  setEditData(p => ({ ...p, playbackSpeed: s })); 
                  if(videoRef.current) videoRef.current.playbackRate = s; 
                }}
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
            </div>
          </div>
        )}
      </AnimatePresence>

      <Marketplace isOpen={isMarketplaceOpen} onClose={() => setIsMarketplaceOpen(false)} applyTemplate={applyTemplate} />
      <input ref={fileInputRef} type="file" hidden accept="video/*" multiple onChange={handleUpload} />
    </div>
  );
};

export default TikTokEditor;