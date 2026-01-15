import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineChatBubbleBottomCenterText, HiOutlineMicrophone, 
  HiOutlineChevronLeft, HiPlus, HiXMark, HiOutlineSparkles,
  HiOutlineMusicalNote, HiOutlineFaceSmile, HiOutlinePaintBrush
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const Messenger = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
  // --- UI & Chat State ---
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // --- 🔥 World-Class Story State ---
  const [selectedStoryFile, setSelectedStoryFile] = useState(null);
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [activeTool, setActiveTool] = useState("filter"); // filter, text, music, ai
  const [storySettings, setStorySettings] = useState({
    filter: "none",
    text: "",
    music: "none",
    aiEnhance: false
  });

  const socket = useRef();
  const scrollRef = useRef();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // --- ১. ইউনিক কল ইঞ্জিন (Navigate to Call Room) ---
  const handleCall = (type) => {
    if (!currentChat) return;
    const roomId = currentChat._id; 
    navigate(`/call/${roomId}?type=${type}`);
  };

  // --- ২. অ্যাডভান্সড স্টোরি আপলোড (With Filters & Settings) ---
  const handleStoryUpload = async () => {
    if (!selectedStoryFile) return;
    try {
      setIsStoryUploading(true);
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("media", selectedStoryFile);
      formData.append("text", storySettings.text || "Neural Update");
      formData.append("isStory", "true");
      formData.append("filter", storySettings.filter);

      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      setSelectedStoryFile(null);
      alert("Story Synced to Nebula!");
    } catch (err) {
      console.error("Story failed", err);
    } finally {
      setIsStoryUploading(false);
    }
  };

  // --- Socket.io Setup ---
  useEffect(() => {
    socket.current = io(API_URL, { transports: ["websocket"] });
    socket.current.on("getMessage", (data) => setMessages((prev) => [...prev, data]));
    if (user?.sub) socket.current.emit("addNewUser", user.sub);
    return () => socket.current.disconnect();
  }, [user]);

  return (
    <div className="flex h-screen bg-[#010409] text-white font-mono overflow-hidden fixed inset-0">
      
      {/* 🟣 PART 1: AI STORY EDITOR MODAL */}
      <AnimatePresence>
        {selectedStoryFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center">
            
            {/* Top Bar */}
            <div className="absolute top-8 w-full px-8 flex justify-between items-center z-10">
               <button onClick={() => setSelectedStoryFile(null)} className="p-4 bg-white/10 backdrop-blur-xl rounded-full hover:bg-red-500/20 transition-all">
                 <HiXMark size={28}/>
               </button>
               <div className="flex gap-4">
                  <button onClick={() => setStorySettings({...storySettings, aiEnhance: !storySettings.aiEnhance})} 
                          className={`p-4 rounded-full backdrop-blur-xl border transition-all ${storySettings.aiEnhance ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_cyan]' : 'bg-white/10 border-white/10'}`}>
                    <HiOutlineSparkles size={24}/>
                  </button>
               </div>
            </div>

            {/* Main Preview Screen (9:16) */}
            <div className="relative w-full max-w-[380px] aspect-[9/16] bg-zinc-900 rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-2xl">
               <img 
                 src={URL.createObjectURL(selectedStoryFile)} 
                 className={`w-full h-full object-cover transition-all duration-700 ${storySettings.aiEnhance ? 'saturate-150 contrast-110' : ''}`} 
                 style={{ 
                    filter: storySettings.filter === 'neon' ? 'hue-rotate(90deg) brightness(1.2) saturate(2)' : 
                            storySettings.filter === 'cyber' ? 'invert(0.1) sepia(0.3) hue-rotate(250deg)' : 'none' 
                 }} 
               />
               
               {/* Kinetic Text Overlay */}
               {storySettings.text && (
                 <motion.div drag dragConstraints={{left:0, right:0, top:0, bottom:0}} className="absolute top-1/2 left-0 right-0 text-center pointer-events-auto cursor-move">
                    <span className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-lg text-xl font-black uppercase tracking-tighter border-l-4 border-cyan-500 italic">
                      {storySettings.text}
                    </span>
                 </motion.div>
               )}
            </div>

            {/* 🎨 World-Class Edit Bar (Floating) */}
            <div className="fixed bottom-32 flex gap-4 bg-black/60 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] border border-white/10 shadow-2xl">
               <button onClick={() => setActiveTool("filter")} className={`p-3 rounded-2xl ${activeTool==='filter'?'bg-cyan-500 text-black':'text-white/40'}`}><HiOutlinePaintBrush size={24}/></button>
               <button onClick={() => setActiveTool("text")} className={`p-3 rounded-2xl ${activeTool==='text'?'bg-cyan-500 text-black':'text-white/40'}`}><HiOutlineChatBubbleBottomCenterText size={24}/></button>
               <button onClick={() => setActiveTool("music")} className={`p-3 rounded-2xl ${activeTool==='music'?'bg-cyan-500 text-black':'text-white/40'}`}><HiOutlineMusicalNote size={24}/></button>
               <button onClick={() => setActiveTool("sticker")} className={`p-3 rounded-2xl ${activeTool==='sticker'?'bg-cyan-500 text-black':'text-white/40'}`}><HiOutlineFaceSmile size={24}/></button>
            </div>

            {/* Sub-Tools Display */}
            {activeTool === 'filter' && (
              <div className="fixed bottom-56 flex gap-3">
                {['none', 'neon', 'cyber'].map(f => (
                  <button key={f} onClick={() => setStorySettings({...storySettings, filter: f})} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border ${storySettings.filter === f ? 'bg-white text-black' : 'border-white/20'}`}>{f}</button>
                ))}
              </div>
            )}

            {activeTool === 'text' && (
              <input 
                autoFocus
                className="fixed bottom-56 bg-transparent border-b-2 border-cyan-500 outline-none text-center text-2xl font-black uppercase"
                placeholder="TYPE NEURAL SIGNAL..."
                onChange={(e) => setStorySettings({...storySettings, text: e.target.value})}
              />
            )}

            {/* Post Button */}
            <button onClick={handleStoryUpload} className="fixed bottom-10 w-[350px] py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 transition-all">
               {isStoryUploading ? "TRANSMITTING..." : "Post Neural Story"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 Sidebar: Node List */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] bg-[#030712]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col`}>
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter italic bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-8">ONYX_MESSENGER</h2>
          
          {/* Stories Horizontal List */}
          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
            <label className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group">
              <div className="w-16 h-16 rounded-[2rem] border-2 border-dashed border-white/20 flex items-center justify-center text-cyan-500 group-hover:border-cyan-500 group-hover:bg-cyan-500/10 transition-all">
                <HiPlus size={28} />
              </div>
              <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Update</span>
              <input type="file" hidden accept="image/*" onChange={(e) => setSelectedStoryFile(e.target.files[0])} />
            </label>
            
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 rounded-[2rem] p-[3px] bg-gradient-to-tr from-cyan-500 via-purple-500 to-blue-500 shrink-0">
                <div className="bg-black w-full h-full rounded-[1.8rem] p-1">
                  <img src={`https://i.pravatar.cc/150?img=${i+20}`} className="w-full h-full rounded-[1.5rem] object-cover" alt="story" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-6 space-y-3">
          {conversations.map((c) => (
            <motion.div whileHover={{ x: 10 }} key={c._id} onClick={() => setCurrentChat(c)} className={`p-6 rounded-[2.5rem] flex items-center gap-5 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 hover:bg-white/10'}`}>
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${currentChat?._id === c._id ? 'bg-black text-cyan-500' : 'bg-zinc-800 text-white/20'}`}>
                 {c._id.slice(-2).toUpperCase()}
               </div>
               <div className="flex-1">
                 <h4 className={`text-sm font-black uppercase tracking-tight ${currentChat?._id === c._id ? 'text-black' : 'text-white/90'}`}>Node_{c._id.slice(-6)}</h4>
                 <p className={`text-[10px] uppercase font-bold ${currentChat?._id === c._id ? 'text-black/60' : 'text-white/20'}`}>Connection Secure</p>
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ⚔️ Main Chat Area & Call HUD */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col relative`}>
        {currentChat ? (
          <>
            <header className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-[#010409]/90 backdrop-blur-xl sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <button onClick={() => setCurrentChat(null)} className="md:hidden text-cyan-400 p-2 bg-white/5 rounded-full"><HiOutlineChevronLeft size={24} /></button>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-500">Active_Node: {currentChat._id.slice(-6)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-white/30 font-bold uppercase">End-to-End Encrypted</span>
                  </div>
                </div>
              </div>
              
              {/* 📞 Pro Call Bar */}
              <div className="flex gap-4">
                <button onClick={() => handleCall('audio')} className="p-4 bg-white/5 rounded-2xl hover:bg-cyan-500 hover:text-black transition-all group">
                   <HiOutlinePhone size={22} className="group-active:scale-90" />
                </button>
                <button onClick={() => handleCall('video')} className="p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all group">
                   <HiOutlineVideoCamera size={22} className="group-active:scale-90" />
                </button>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-7 py-4 rounded-[2rem] border text-[13px] font-medium leading-relaxed ${m.senderId === user?.sub ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-100 rounded-tr-none' : 'bg-zinc-900 border-white/10 text-white/80 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* ⌨️ Input Bar */}
            <div className="p-10 bg-gradient-to-t from-[#010409] via-[#010409] to-transparent">
              <div className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl focus-within:border-cyan-500/50 transition-all">
                <button className="p-4 text-white/20 hover:text-cyan-500"><HiOutlineMicrophone size={24} /></button>
                <input 
                   value={newMessage} 
                   onChange={(e) => setNewMessage(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                   placeholder="Type a neural signal..." 
                   className="flex-1 bg-transparent border-none outline-none text-sm tracking-wide placeholder:text-white/10" 
                />
                <button onClick={handleSend} className="p-5 bg-cyan-500 rounded-full text-black shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all">
                   <HiOutlinePaperAirplane size={22} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]"></div>
            <HiOutlineChatBubbleBottomCenterText size={100} className="text-zinc-800 mb-6" />
            <p className="text-[11px] font-black tracking-[1.5em] text-white/10 uppercase">Waiting_for_Uplink</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;