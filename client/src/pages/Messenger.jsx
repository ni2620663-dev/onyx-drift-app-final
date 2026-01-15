import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineChatBubbleBottomCenterText, HiOutlineChevronLeft, HiPlus, HiXMark, 
  HiOutlineMusicalNote, HiLanguage, HiCheck, HiOutlineMagnifyingGlass
} from "react-icons/hi2";

const Messenger = () => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [allStories, setAllStories] = useState([]); 
  const [viewingStory, setViewingStory] = useState(null);
  const [selectedStoryFile, setSelectedStoryFile] = useState(null);
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [activeTool, setActiveTool] = useState(null); 
  const [storySettings, setStorySettings] = useState({
    filter: "none", text: "", musicName: "", musicUrl: ""
  });

  const socket = useRef();
  const scrollRef = useRef();
  const audioRef = useRef(new Audio());
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  const viralSongs = [
    { name: "After Dark x Sweater Weather", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Cyberdrift 2077", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "Nightcall - Kavinsky", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { name: "Metamorphosis", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  ];

  // ১. স্টোরি ফেচ করা
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/stories`);
        setAllStories(res.data);
      } catch (err) { console.error("Error fetching stories", err); }
    };
    if (isAuthenticated) fetchStories();
  }, [isAuthenticated]);

  // ২. স্টোরি ওপেন ও মিউজিক প্লে
  const handleOpenStory = (story) => {
    setViewingStory(story);
    if (story.musicUrl) {
      audioRef.current.src = story.musicUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => console.log("Click anywhere to enable audio"));
      }
    }
  };

  const handleCloseStory = () => {
    setViewingStory(null);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  // ৩. স্টোরি আপলোড (৫০০ এরর ফিক্স করা হয়েছে)
  const handleStoryUpload = async () => {
    if (!selectedStoryFile || !user) return;
    try {
      setIsStoryUploading(true);
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      
      // এই ফিল্ডগুলো ব্যাকএন্ডে মাস্ট দরকার
      formData.append("media", selectedStoryFile);
      formData.append("userId", user.sub); 
      formData.append("text", storySettings.text);
      formData.append("musicName", storySettings.musicName);
      formData.append("musicUrl", storySettings.musicUrl);
      formData.append("onlyMessenger", "true");

      const res = await axios.post(`${API_URL}/api/stories`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data" 
        }
      });

      setAllStories([res.data, ...allStories]);
      setSelectedStoryFile(null);
      setStorySettings({ filter: "none", text: "", musicName: "", musicUrl: "" });
    } catch (err) { 
      console.error("Upload Failed:", err.response?.data || err.message);
      alert("Upload failed. Check console for details.");
    } finally { 
      setIsStoryUploading(false); 
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    socket.current.emit("sendMessage", {
      senderId: user.sub,
      receiverId: currentChat.members.find(m => m !== user.sub),
      text: newMessage
    });
    setMessages([...messages, { senderId: user.sub, text: newMessage }]);
    setNewMessage("");
  };

  const filteredConversations = conversations.filter(c => 
    c._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#010409] text-white font-mono overflow-hidden fixed inset-0">
      
      {/* 🎬 STORY VIEWER */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] bg-black flex items-center justify-center">
             <div className="relative w-full max-w-[420px] h-full md:h-[92vh] bg-zinc-900 overflow-hidden md:rounded-3xl shadow-2xl">
                <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 z-50 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 7, ease: "linear" }} onAnimationComplete={handleCloseStory} className="h-full bg-cyan-500" />
                </div>
                
                <img src={viewingStory.mediaUrl} className="w-full h-full object-cover" alt="story" />
                
                <div className="absolute inset-0 flex flex-col justify-center items-center p-10 pointer-events-none">
                  <span className="bg-white text-black px-4 py-1 text-xl font-black uppercase italic pointer-events-auto">{viewingStory.text}</span>
                </div>

                <div className="absolute top-8 right-6 z-50 flex gap-2">
                  <button onClick={handleCloseStory} className="p-2 bg-black/40 backdrop-blur-md rounded-full"><HiXMark size={24}/></button>
                </div>

                {/* ❤️ REACTIONS */}
                <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-6 z-50">
                  {['❤️', '🔥', '👍'].map(emoji => (
                    <button key={emoji} className="text-2xl hover:scale-125 transition-transform bg-black/20 p-2 rounded-full backdrop-blur-sm" onClick={() => alert(`${emoji} Sent!`)}>{emoji}</button>
                  ))}
                </div>

                {viewingStory.musicName && (
                  <div className="absolute bottom-10 left-6 right-6 flex items-center gap-4 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                    <HiOutlineMusicalNote className="text-pink-500 animate-pulse" size={20} />
                    <p className="text-[10px] font-black uppercase tracking-widest truncate">{viewingStory.musicName}</p>
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟣 STORY EDITOR */}
      <AnimatePresence>
        {selectedStoryFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[420px] h-full md:h-[92vh] bg-zinc-900 md:rounded-[3rem] overflow-hidden">
              <img src={URL.createObjectURL(selectedStoryFile)} className="w-full h-full object-cover" alt="preview" />

              <div className="absolute top-8 left-0 right-0 px-6 flex justify-between z-50">
                <button onClick={() => setSelectedStoryFile(null)} className="p-3 bg-black/40 rounded-full hover:bg-black/60 transition-all"><HiXMark size={24}/></button>
                <button onClick={handleStoryUpload} disabled={isStoryUploading} className="px-8 py-2 bg-white text-black font-black rounded-full text-[11px] uppercase shadow-xl hover:bg-cyan-400 transition-all">
                  {isStoryUploading ? "Uploading..." : "Share Story"}
                </button>
              </div>

              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
                <button onClick={() => setActiveTool('text')} className="p-3.5 rounded-full bg-black/40 border border-white/10 hover:bg-white hover:text-black transition-all"><HiLanguage size={24}/></button>
                <button onClick={() => setActiveTool('music')} className="p-3.5 rounded-full bg-black/40 border border-white/10 hover:bg-pink-500 transition-all"><HiOutlineMusicalNote size={24}/></button>
              </div>

              {storySettings.text && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white text-black px-5 py-2 text-xl font-black italic uppercase shadow-2xl">{storySettings.text}</span>
                </div>
              )}

              {activeTool === 'music' && (
                <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="absolute bottom-0 w-full bg-black/95 p-8 rounded-t-[2.5rem] border-t border-white/10 z-[60]">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-white/40">Select Soundtrack</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {viralSongs.map(track => (
                      <button key={track.name} onClick={() => {setStorySettings({...storySettings, musicName: track.name, musicUrl: track.url}); setActiveTool(null);}} 
                        className="w-full flex justify-between p-4 bg-white/5 rounded-2xl text-[11px] font-bold uppercase hover:bg-white/10 transition-all">
                        {track.name} <HiCheck className={storySettings.musicName === track.name ? "text-pink-500" : "opacity-0"}/>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* টেক্সট ইনপুট পপআপ */}
            {activeTool === 'text' && (
              <div className="fixed inset-0 bg-black/80 z-[70] flex flex-col items-center justify-center p-10">
                <input 
                  autoFocus 
                  className="bg-transparent text-center text-3xl font-black uppercase text-white w-full outline-none border-b-2 border-cyan-500 pb-4" 
                  placeholder="TYPE STORY TEXT..." 
                  value={storySettings.text} 
                  onChange={(e) => setStorySettings({...storySettings, text: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveTool(null)}
                />
                <button onClick={() => setActiveTool(null)} className="mt-10 px-10 py-3 bg-white text-black font-black rounded-full uppercase text-[12px] tracking-widest">Add Text</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 SIDEBAR */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[420px] bg-[#030712]/90 backdrop-blur-3xl border-r border-white/5 flex flex-col`}>
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-black tracking-tighter italic bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-8">ONYX_NODES</h2>
          
          <div className="relative mb-8 group">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH NODE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold tracking-widest uppercase outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-6">
            <label className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group">
              <div className="w-16 h-16 rounded-[2.2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-cyan-500 group-hover:border-cyan-500 transition-all">
                <HiPlus size={28} />
              </div>
              <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Add Story</span>
              <input type="file" hidden accept="image/*" onChange={(e) => setSelectedStoryFile(e.target.files[0])} />
            </label>
            
            {allStories.map((s, i) => (
              <div key={i} onClick={() => handleOpenStory(s)} className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group">
                <div className="w-16 h-16 rounded-[2.2rem] p-[3px] bg-gradient-to-tr from-cyan-500 to-fuchsia-500 group-hover:scale-110 transition-transform">
                  <div className="bg-black w-full h-full rounded-[2rem] p-1">
                    <img src={s.mediaUrl} className="w-full h-full rounded-[1.8rem] object-cover" alt="story" />
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase text-white/20 truncate w-16 text-center">Node_{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-3 custom-scrollbar">
          {filteredConversations.map((c) => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className={`p-6 rounded-[2.5rem] flex items-center gap-5 cursor-pointer border transition-all ${currentChat?._id === c._id ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${currentChat?._id === c._id ? 'bg-black text-cyan-500' : 'bg-zinc-800 text-white/20'}`}>
                  {c._id.slice(-2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase">Node_{c._id.slice(-4)}</h4>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Uplink Active</p>
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚔️ CHAT AREA */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-[#010409]`}>
        {currentChat ? (
          <>
            <header className="px-10 py-8 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-6">
                <button onClick={() => setCurrentChat(null)} className="md:hidden text-cyan-400"><HiOutlineChevronLeft size={24} /></button>
                <h3 className="text-sm font-black uppercase tracking-widest text-cyan-500">Terminal_{currentChat._id.slice(-4)}</h3>
              </div>
              <div className="flex gap-4">
                <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10"><HiOutlinePhone size={22} /></button>
                <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10"><HiOutlineVideoCamera size={22} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-6 py-4 rounded-[2rem] text-[13px] ${m.senderId === user?.sub ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100' : 'bg-zinc-900 border border-white/10 text-white/80'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-10">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[3rem] border border-white/10 focus-within:border-cyan-500/50 transition-all">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Transmit message..." className="flex-1 bg-transparent outline-none px-4 font-bold text-sm" />
                <button onClick={handleSend} className="p-5 bg-cyan-500 rounded-full text-black hover:scale-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/40">
                  <HiOutlinePaperAirplane size={22} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <HiOutlineChatBubbleBottomCenterText size={120} className="animate-pulse" />
            <p className="mt-6 uppercase tracking-[1.5em] text-[10px] font-black">Select Neural Node</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Messenger;