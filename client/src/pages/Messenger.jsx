import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiPlus, HiChatBubbleLeftRight, HiUsers, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiShieldCheck, HiBolt, HiSparkles, 
  HiMagnifyingGlass, 
  HiOutlinePhoneXMark, HiOutlineMicrophone, HiOutlineSpeakerWave,
  HiOutlineTrash, HiOutlineLockClosed, HiOutlineEyeSlash, HiOutlinePhoto,
  HiOutlineClock, HiCheckBadge 
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

// 🧠 Phase-7: Display Name & Avatar Logic
const getDisplayName = (u) => {
  if (!u) return "Drifter";
  const name = u.name || u.nickname || u.displayName || u.username || (u.email ? u.email.split('@')[0] : null);
  const fallback = u.userId?.slice(-6) || u.sub?.slice(-6) || "User";
  return name ? name.trim() : `@${fallback}`;
};

const getAvatar = (u) => {
  if (u?.picture || u?.avatar || u?.image) return u.picture || u.avatar || u.image;
  const name = getDisplayName(u);
  return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(name)}`;
};

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  const CLOUD_NAME = "dx0cf0ggu";
  const UPLOAD_PRESET = "onyx_upload"; 

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState(""); 
  
  // 🔍 New Search States
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isIncognito, setIsIncognito] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [statusText, setStatusText] = useState("Vibing with OnyxDrift ⚡");
  const [tempName, setTempName] = useState("");
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef();
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  // 🛡️ Helper to get valid JWT token for Backend
  const getAuthToken = useCallback(async () => {
    return await getAccessTokenSilently({
      authorizationParams: {
        audience: "https://onyx-drift-api.com", // This fixes the 401 error
      },
    });
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (user) setTempName(getDisplayName(user));
  }, [user]);

  const uploadToCloudinary = async (file, type) => {
    const formData = new FormData();
    let fileToUpload = file;
    if (type === "voice" || type === "audio") {
      fileToUpload = new File([file], `voice-${Date.now()}.wav`, { type: "audio/wav" });
    }
    formData.append("file", fileToUpload);
    formData.append("upload_preset", UPLOAD_PRESET); 
    const resourceType = (type === "voice" || type === "audio") ? "video" : "auto"; 
    try {
      const response = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, formData);
      return response.data.secure_url;
    } catch (err) { return null; }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, [getAuthToken, API_URL]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { if (err.response?.status === 404) setMessages([]); }
  }, [getAuthToken, API_URL]);

  const handleUserSearch = async (val) => {
    setSearchQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      try {
        const token = await getAuthToken();
        const res = await axios.get(`${API_URL}/api/messages/search-users/${val}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const startConversation = async (receiverId) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(`${API_URL}/api/messages/conversation`, 
        { receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchConversations();
      setCurrentChat(res.data);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      alert("Failed to sync with drifter.");
    }
  };

  const handleIdSearch = async (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      startConversation(searchQuery.trim());
    }
  };

  const deleteChat = async (e, convId) => {
    e.stopPropagation();
    if (window.confirm("Permanently purge this signal history?")) {
      try {
        const token = await getAuthToken();
        await axios.delete(`${API_URL}/api/messages/conversation/${convId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(prev => prev.filter(c => c._id !== convId));
        if (currentChat?._id === convId) setCurrentChat(null);
      } catch (err) { alert("Failed to delete."); }
    }
  };

  useEffect(() => { if (currentChat?._id) fetchMessages(currentChat._id); }, [currentChat, fetchMessages]);
  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;
    s.emit("addNewUser", user.sub);
    const messageHandler = (data) => {
      if (currentChat?._id === data.conversationId) {
        setMessages((prev) => [...prev, data]);
        if(data.isSelfDestruct) setTimeout(() => setMessages(prev => prev.filter(m => m._id !== data._id)), 10000);
      }
      fetchConversations();
    };
    s.on("getMessage", messageHandler);
    return () => s.off("getMessage", messageHandler);
  }, [socket, currentChat, user, fetchConversations]);

  const handleSend = async (e, mediaUrl = null, mediaType = null) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !mediaUrl) return;
    const tempId = Date.now().toString();
    const msgData = {
      _id: tempId,
      senderId: user.sub,
      senderName: getDisplayName(user),
      text: newMessage,
      media: mediaUrl,
      mediaType: mediaType,
      conversationId: currentChat._id,
      isSelfDestruct: isSelfDestruct,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", { ...msgData, receiverId: currentChat.userDetails?.userId });
    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isSelfDestruct) setTimeout(() => setMessages(prev => prev.filter(m => m._id !== tempId)), 10000);
    } catch (err) { console.error(err); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = await uploadToCloudinary(audioBlob, "voice");
        if (url) handleSend(null, url, "voice");
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { alert("Mic access denied"); }
  };

  const stopRecording = () => { if (mediaRecorder.current) { mediaRecorder.current.stop(); setIsRecording(false); } };
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className={`fixed inset-0 text-white font-sans overflow-hidden z-[9999] transition-colors duration-500 ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        
        {activeTab === "settings" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-6 pt-12 no-scrollbar">
            <h2 className="text-3xl font-black mb-8 uppercase italic text-cyan-500 tracking-tighter">System Config</h2>
            <div className="flex flex-col items-center gap-6 mb-10">
                <img src={getAvatar(user)} className="w-28 h-28 rounded-[3rem] border-4 border-cyan-500/20 object-cover" alt="Me" />
                <div className="text-center w-full space-y-2">
                    {isEditingProfile ? (
                        <div className="space-y-3">
                            <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-center text-white outline-none focus:border-cyan-500" placeholder="Display Name" />
                            <button onClick={() => setIsEditingProfile(false)} className="w-full bg-cyan-500 text-black py-3 rounded-2xl font-black uppercase text-xs">Save Changes</button>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold">{tempName || getDisplayName(user)}</h3>
                            <p className="text-cyan-500/60 font-black text-[10px] uppercase tracking-widest">{statusText}</p>
                            <button onClick={() => setIsEditingProfile(true)} className="text-[10px] text-zinc-500 underline uppercase mt-2">Edit Signal Identity</button>
                        </>
                    )}
                </div>
            </div>
          </motion.div>
        ) : (
          <>
            <header className="p-6 pt-12 flex flex-col gap-4 bg-black/40 border-b border-white/5 backdrop-blur-3xl relative z-[300]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={getAvatar(user)} className="w-12 h-12 rounded-2xl border-2 border-cyan-500/20 object-cover" alt="Me" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#02040a] rounded-full ${isIncognito ? 'bg-purple-500' : 'bg-green-500'}`} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black italic text-cyan-500 uppercase tracking-tighter">OnyxDrift</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{getDisplayName(user)}</p>
                  </div>
                </div>
                <button onClick={() => setIsIncognito(!isIncognito)} className={`p-3 rounded-2xl ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
                    <HiOutlineEyeSlash size={24}/>
                </button>
              </div>

              {/* 🔍 Enhanced Search Bar */}
              <div className="relative">
                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 mt-2 focus-within:border-cyan-500/50 transition-all">
                  <HiMagnifyingGlass size={20} className={isSearching ? "text-cyan-500 animate-pulse" : "text-zinc-500 mr-2"} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    onKeyDown={handleIdSearch}
                    placeholder="Scan Identity or ID..."
                    className="bg-transparent flex-1 outline-none text-sm text-white placeholder:text-zinc-600 ml-2"
                  />
                </div>

                {/* 📑 Global Search Dropdown */}
                {searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="absolute top-full left-0 w-full bg-[#121212] border border-white/10 rounded-2xl mt-2 z-[500] overflow-hidden shadow-2xl backdrop-blur-3xl"
                  >
                    {searchResults.map((u) => (
                      <div 
                        key={u._id} 
                        onClick={() => startConversation(u.userId || u.sub || u.auth0Id)}
                        className="p-4 hover:bg-white/5 flex items-center gap-3 cursor-pointer border-b border-white/5 last:border-0"
                      >
                        <img src={getAvatar(u)} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-200">{getDisplayName(u)}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Active Drifter</p>
                        </div>
                        <HiPlus className="text-cyan-500" size={18} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-32 px-4 mt-4 no-scrollbar">
                <div className="space-y-1">
                  {conversations.map(c => (
                    <div key={c._id} className="group relative">
                      <div onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 active:bg-white/10 rounded-[2.2rem] transition-all cursor-pointer">
                          <img src={getAvatar(c.userDetails)} className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-black/50" alt="" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-100 truncate">{getDisplayName(c.userDetails)}</span>
                                <HiCheckBadge className="text-cyan-500" size={16}/>
                            </div>
                            <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage?.text || "New signal transmission..."}</p>
                          </div>
                      </div>
                      
                      <button 
                        onClick={(e) => deleteChat(e, c._id)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-red-500/10 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
            </div>
          </>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-20 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[110]">
            <button onClick={() => setActiveTab("chats")} className={`p-4 ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
            <button onClick={() => setActiveTab("groups")} className={`p-4 ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiUsers size={28} /></button>
            <button onClick={() => setActiveTab("settings")} className={`p-4 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`fixed inset-0 z-[200] flex flex-col ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
            <header className="p-4 pt-10 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={30}/></button>
                 <img src={getAvatar(currentChat.userDetails)} className="w-10 h-10 rounded-xl object-cover" alt="" />
                 <div>
                    <h3 className="text-[15px] font-bold">{getDisplayName(currentChat.userDetails)}</h3>
                    <p className="text-[9px] text-cyan-500 font-black uppercase flex items-center gap-1"><HiOutlineLockClosed size={10}/> Secured</p>
                 </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => setIsSelfDestruct(!isSelfDestruct)} className={`p-3 rounded-2xl ${isSelfDestruct ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-500'}`}><HiOutlineClock size={24}/></button>
                 <button className="p-3 text-cyan-500"><HiOutlineVideoCamera size={24}/></button>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] relative ${m.senderId === user?.sub ? (isIncognito ? 'bg-purple-600' : 'bg-cyan-600') + ' rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                    {m.text && <p className="text-sm">{m.text}</p>}
                    {m.mediaType === "image" && <img src={m.media} className="rounded-xl mt-2 max-h-60 w-full object-cover" alt="media" />}
                    {m.mediaType === "voice" && <audio controls className="h-8 w-40 filter invert mt-2"><source src={m.media} type="audio/wav" /></audio>}
                    {m.isSelfDestruct && <HiBolt className="absolute -top-1 -right-1 text-orange-500" size={14}/>}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 pb-12 bg-black/60 backdrop-blur-md">
              <form onSubmit={handleSend} className="flex items-center gap-2 bg-white/5 p-2 rounded-[2.2rem] border border-white/10">
                 <label className="p-3 text-zinc-400 cursor-pointer">
                    <HiOutlinePhoto size={22}/>
                    <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) uploadToCloudinary(file, file.type.startsWith("image") ? "image" : "file").then(url => handleSend(null, url, "image"));
                    }} />
                 </label>
                 <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send signal..." className="bg-transparent flex-1 px-2 outline-none text-white text-sm" />
                 
                 {!newMessage.trim() ? (
                    <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} className={`p-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10 text-zinc-400'}`}>
                       <HiOutlineMicrophone size={22} />
                    </button>
                 ) : (
                    <button type="submit" className="p-4 bg-cyan-500 rounded-full">
                       <HiOutlinePaperAirplane size={22} className="-rotate-45 text-black" />
                    </button>
                 )}
              </form>
            </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;