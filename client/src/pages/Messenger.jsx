import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { 
  HiChatBubbleLeftRight, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiOutlineEyeSlash, 
  HiUsers, HiMagnifyingGlass, HiOutlineBell,
  HiOutlinePhoto, HiOutlineMicrophone, HiOutlineStopCircle,
  HiPlay, HiPause
} from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Neural Components
import MoodSelector from "./MoodSelector";
import GroupMessenger from "./GroupMessenger";
import GroupCallScreen from "./GroupCallScreen"; 
import Notification from "./Notifications";
import Settings from "./Settings";

/* =================🌀 NEURAL NEON SPINNER ================= */
const NeonSpinner = () => (
  <div className="flex flex-col items-center justify-center py-10 space-y-4">
    <div className="relative w-12 h-12">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="absolute inset-0 border-2 border-transparent border-t-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute inset-2 border-2 border-transparent border-b-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"
      />
    </div>
    <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.2em] animate-pulse">Syncing Neural Buffer...</p>
  </div>
);

/* =================🎙️ NEURAL AUDIO PLAYER ================= */
const NeuralAudioPlayer = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio(url));

  const togglePlay = () => {
    if (isPlaying) { audioRef.current.pause(); } 
    else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-cyan-500/20 w-48">
      <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]">
        {isPlaying ? <HiPause size={18}/> : <HiPlay size={18} className="ml-0.5"/>}
      </button>
      <div className="flex gap-1 items-center h-4 overflow-hidden flex-1">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={isPlaying ? { height: [4, 16, 8, 14, 4] } : { height: 4 }}
            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
            className="w-1 bg-cyan-500/60 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

/* ================= UFO MAIN MESSENGER COMPONENT ================= */
const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); 
  const [selectedMood, setSelectedMood] = useState("Neural-Flow");
  const [isIncognito, setIsIncognito] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const mediaRecorderRef = useRef(null);
  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const tokenCache = useRef(null);

  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
  const AUTH_AUDIENCE = "https://onyx-drift-api.com";
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dofp85tq4/upload";
  const UPLOAD_PRESET = "onyx_drift_presets";

  /* =================🔒 AUTH CORE ================= */
  const getAuthToken = useCallback(async () => {
    try {
      if (tokenCache.current) return tokenCache.current;
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUTH_AUDIENCE, scope: "openid profile email" },
      });
      tokenCache.current = token;
      return token;
    } catch (e) {
      console.error("Neural Token Acquisition Failed:", e);
      return null;
    }
  }, [getAccessTokenSilently]);

  const neuralApi = useCallback(async () => {
    const token = await getAuthToken();
    return axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [getAuthToken]);

  /* =================📞 CALLING ENGINE (WebRTC Trigger) ================= */
  const initiateCall = (type) => {
    if (!currentChat || !user) return;
    const receiverId = currentChat.members?.find(m => m !== user.sub);
    const roomId = `room_${user.sub.slice(-5)}_${receiverId.slice(-5)}_${Date.now()}`;
    if (receiverId) {
      navigate(`/call/${roomId}?to=${receiverId}&mode=${type}`);
    }
  };

  /* =================🎙️ VOICE RECORDING ================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        await handleFileUpload(null, blob, "voice");
      };
      
      recorder.start();
      setIsRecording(true);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("Microphone Access Denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  /* =================📁 MEDIA HANDLING ================= */
  const handleFileUpload = async (e, blob = null, type = "image") => {
    const file = blob || e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(CLOUDINARY_URL, formData);
      handleSend(res.data.secure_url, type);
    } catch (err) {
      console.error("Media Transmission Failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  /* =================📡 SIGNAL TRANSMISSION ================= */
  const handleSend = async (mediaUrl = null, type = "text") => {
    if ((!newMessage.trim() && !mediaUrl) || !currentChat || !user) return;
    
    const msgData = {
      senderId: user.sub,
      senderName: isIncognito ? "Ghost-Drifter" : (user.name || user.nickname),
      senderAvatar: isIncognito ? "https://ui-avatars.com/api/?name=Ghost&background=000" : user.picture,
      text: newMessage,
      media: mediaUrl,
      mediaType: type,
      conversationId: currentChat._id,
      neuralMood: selectedMood,
      isIncognito: isIncognito,
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, { ...msgData, _id: Date.now().toString() }]);
    setNewMessage("");

    const s = socket?.current || socket;
    if (s) {
      const receiverId = currentChat.members?.find(m => m !== user.sub);
      s.emit("sendMessage", { ...msgData, receiverId });
    }

    try {
      if (!isIncognito) {
        const api = await neuralApi();
        await api.post("/api/messages/message", msgData);
      }
    } catch (err) { console.error("Signal Lost:", err); }
  };

  /* =================⚡ REAL-TIME SYNC ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user) return;
    
    s.on("getMessage", (data) => {
      if(currentChat?._id === data.conversationId) setMessages(prev => [...prev, data]);
      fetchConversations();
    });

    s.on("typing", (data) => {
       if(currentChat?._id === data.conversationId) setTypingUser(data.senderName);
       setTimeout(() => setTypingUser(null), 3000);
    });

    return () => { 
      s.off("getMessage"); 
      s.off("typing");
    };
  }, [socket, currentChat, user]);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const api = await neuralApi();
      const res = await api.get("/api/messages/conversations");
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Sync Error:", err); }
  }, [isAuthenticated, neuralApi]);

  const fetchMessages = async (convId) => {
    setIsLoadingMessages(true);
    try {
      const api = await neuralApi();
      const res = await api.get(`/api/messages/${convId}`);
      setMessages(res.data);
    } catch (err) { console.error("Buffer Error:", err); } 
    finally { setIsLoadingMessages(false); }
  };

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);
  useEffect(() => { if (currentChat) fetchMessages(currentChat._id); }, [currentChat]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (authLoading) return <div className="h-screen bg-[#02040a] flex items-center justify-center text-cyan-500 font-mono animate-pulse">BOOTING NEURAL INTERFACE...</div>;

  return (
    <div className={`fixed inset-0 text-white h-[100dvh] overflow-hidden transition-all duration-700 ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      <AnimatePresence>
        {showNotification && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-[300] bg-[#02040a] flex flex-col">
            <header className="p-4 pt-12 flex items-center gap-4 border-b border-white/5 bg-black/50 backdrop-blur-xl">
              <button onClick={() => setShowNotification(false)} className="p-2 text-zinc-400"><HiOutlineChevronLeft size={24}/></button>
              <h2 className="font-black uppercase tracking-widest text-sm text-cyan-500">Neural Log</h2>
            </header>
            <div className="flex-1 overflow-y-auto"><Notification /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 Conversations List */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden' : 'flex'}`}>
        <header className="p-5 pt-12 flex flex-col gap-4 bg-black/40 border-b border-white/5 backdrop-blur-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={user?.picture} className="w-10 h-10 rounded-xl border border-cyan-500/30 object-cover" alt="Profile" />
              <div>
                <h1 className="text-lg font-black italic text-cyan-500 uppercase tracking-tighter">ONYXDRIFT</h1>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Node: {user?.nickname}</p>
              </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setShowNotification(true)} className="p-2.5 bg-white/5 rounded-xl text-zinc-400 relative">
                 <HiOutlineBell size={20}/>
                 <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
               </button>
               <button onClick={() => setIsIncognito(!isIncognito)} className={`p-2.5 rounded-xl transition-all ${isIncognito ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-zinc-500'}`}>
                 <HiOutlineEyeSlash size={20}/>
               </button>
            </div>
          </div>
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
            <input type="text" placeholder="Scan the grid..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-32">
          {activeTab === "chats" && conversations.map(c => (
            <motion.div whileTap={{ scale: 0.98 }} key={c._id} onClick={() => setCurrentChat(c)} className="p-3.5 flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.05] transition-all">
              <img src={c.userDetails?.avatar || `https://ui-avatars.com/api/?name=${c.userDetails?.name}`} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="Avatar" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-zinc-200">{c.userDetails?.name || "Drifter"}</span>
                  <span className="text-[8px] text-zinc-600 font-mono">{new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate italic">{c.lastMessage?.text || "New encrypted channel..."}</p>
              </div>
            </motion.div>
          ))}
          
          {/* GroupMessenger add kora holo ekhane */}
          {activeTab === "groups" && (
            <GroupMessenger 
              socket={socket} 
              API_URL={API_URL} 
              getAuthToken={getAuthToken} 
              onSelectGroup={(group) => setCurrentChat({ ...group, isGroup: true, userDetails: { name: group.name, avatar: "https://ui-avatars.com/api/?name=Group" } })}
            />
          )}
          
          {activeTab === "settings" && <Settings />}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 p-4 pb-10 flex justify-around items-center bg-black/80 backdrop-blur-2xl border-t border-white/5 z-50">
          <button onClick={() => setActiveTab("chats")} className={`p-3 flex flex-col items-center gap-1 ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiChatBubbleLeftRight size={24} />
            <span className="text-[8px] font-black uppercase">Channels</span>
          </button>
          <button onClick={() => setActiveTab("groups")} className={`p-3 flex flex-col items-center gap-1 ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiUsers size={24} />
            <span className="text-[8px] font-black uppercase">Nexus</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`p-3 flex flex-col items-center gap-1 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiCog6Tooth size={24} />
            <span className="text-[8px] font-black uppercase">Config</span>
          </button>
        </nav>
      </div>

      {/* 💬 Chat Interface */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-[200] flex flex-col bg-[#02040a]">
            <header className="p-3 pt-12 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={28}/></button>
                  <img src={currentChat.userDetails?.avatar} className="w-9 h-9 rounded-lg border border-cyan-500/20 object-cover" alt="User" />
                  <div>
                    <h3 className="font-bold text-xs">{currentChat.userDetails?.name}</h3>
                    <div className="flex items-center gap-1">
                       <div className={`w-1.5 h-1.5 rounded-full ${typingUser ? 'bg-green-500 animate-bounce' : 'bg-cyan-500 animate-pulse'}`}/>
                       <p className="text-[8px] text-cyan-500 font-black uppercase tracking-widest">{typingUser ? 'Typing Signal...' : 'Linked'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1 pr-2">
                  <button onClick={() => initiateCall('audio')} className="p-2.5 text-zinc-400 hover:text-cyan-500 hover:bg-white/5 rounded-xl active:scale-90 transition-all">
                    <FaPhone size={16}/>
                  </button>
                  <button onClick={() => initiateCall('video')} className="p-2.5 text-zinc-400 hover:text-cyan-500 hover:bg-white/5 rounded-xl active:scale-90 transition-all">
                    <HiOutlineVideoCamera size={22}/>
                  </button>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
              {isLoadingMessages ? <NeonSpinner /> : messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] border transition-all duration-500 ${m.senderId === user?.sub ? "bg-cyan-500/10 border-cyan-500/20 text-white" : "bg-white/5 border-white/10 text-zinc-300"}`}>
                    {m.mediaType === "image" && <img src={m.media} alt="Neural" className="rounded-lg mb-2 max-h-60 w-full object-cover shadow-lg border border-white/10" />}
                    {m.mediaType === "voice" && <NeuralAudioPlayer url={m.media} />}
                    {m.text && <p className="text-[13px] leading-relaxed break-words">{m.text}</p>}
                  </div>
                  <span className="text-[7px] text-zinc-600 mt-1 uppercase font-mono">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-black/90 backdrop-blur-2xl border-t border-white/5">
              <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />
              <div className="flex items-center gap-2 mt-4 bg-white/5 p-1.5 pl-4 rounded-3xl border border-white/10">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, null, "image")} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current.click()} className="text-zinc-500 p-2 hover:text-cyan-500">
                  <HiOutlinePhoto size={22} className={isUploading ? "animate-spin" : ""} />
                </button>
                <input 
                  value={newMessage} 
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    const s = socket?.current || socket;
                    if(s && currentChat) s.emit("typing", { conversationId: currentChat._id, senderName: user.name });
                  }} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                  placeholder="Transmit signal..." 
                  className="bg-transparent flex-1 outline-none text-white text-[13px]" 
                />
                {newMessage.trim() === "" ? (
                  <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 text-zinc-400'}`}>
                    {isRecording ? <HiOutlineStopCircle size={20} /> : <HiOutlineMicrophone size={20} />}
                  </button>
                ) : (
                  <button onClick={() => handleSend()} className="p-3 rounded-full bg-cyan-500 text-black active:scale-90">
                    <HiOutlinePaperAirplane size={18} className="-rotate-45" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;