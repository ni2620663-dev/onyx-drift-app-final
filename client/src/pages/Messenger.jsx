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
  HiOutlineTrash, HiOutlineLockClosed, HiOutlineEyeSlash, HiOutlinePhoto, HiOutlineMicrophone as HiMic,
  HiOutlineClock, HiCheckBadge 
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

import CallOverlay from "../components/Messenger/CallOverlay";

// 🧠 PHASE-7: DISPLAY NAME RULE
const getDisplayName = (u) => {
  if (!u) return "Drifter";
  const name = u.name?.trim() || u.nickname?.trim() || u.displayName?.trim();
  const fallback = u.userId || u.sub?.slice(-6) || "Drifter";
  return name && name !== "" ? name : `@${fallback}`;
};

// Fallback image in case placeholder.com fails
const FALLBACK_AVATAR = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=Drifter";

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // Cloudinary Configs
  const CLOUD_NAME = "dx0cf0ggu";
  const UPLOAD_PRESET = "onyx_upload"; 

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [statusText, setStatusText] = useState("Vibing with OnyxDrift ⚡");
  const [tempName, setTempName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  useEffect(() => {
    if (user?.name) setTempName(user.name);
  }, [user]);

  // --- 🛠 CLOUDINARY UPLOAD (FIXED FOR VOICE/MEDIA) ---
  const uploadToCloudinary = async (file, type) => {
    const formData = new FormData();
    
    // Voice/Audio Blob হলে সেটিকে ফাইলে রূপান্তর করা জরুরি
    let fileToUpload = file;
    if (type === "voice" || type === "audio") {
      fileToUpload = new File([file], `voice-${Date.now()}.wav`, { type: "audio/wav" });
    }

    formData.append("file", fileToUpload);
    formData.append("upload_preset", UPLOAD_PRESET); 
    
    // Voice এর জন্য 'video' এবং বাকি সব 'auto' বা 'image'
    const resourceType = (type === "voice" || type === "audio") ? "video" : "auto"; 
    
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (err) {
      console.error("Cloudinary Error Detail:", err.response?.data || err);
      return null;
    }
  };
    

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) { console.error("Search failed", err); }
    setIsSearching(false);
  };

  const kickMember = async (targetUserId) => {
    if (!window.confirm("Are you sure you want to purge this drifter?")) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.patch(`${API_URL}/api/messages/group/kick/${currentChat._id}`, 
        { userIdToRemove: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentChat(prev => ({
        ...prev,
        members: prev.members.filter(id => id !== targetUserId)
      }));
    } catch (err) { alert(err.response?.data?.error || "Purge failed."); }
  };

  const promoteToAdmin = async (newAdminId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.patch(`${API_URL}/api/messages/group/promote/${currentChat._id}`, 
        { newAdminId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentChat(prev => ({ ...prev, admin: newAdminId }));
      alert("New Admin established.");
    } catch (err) { alert("Power transfer failed."); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    let type = file.type.startsWith("image/") ? "image" : "file";
    const url = await uploadToCloudinary(file, type);
    if (url) sendMediaMessage(url, type);
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
        if (url) sendMediaMessage(url, "voice");
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { alert("Mic access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const sendMediaMessage = async (url, type) => {
    handleSend(null, url, type);
  };

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setConversations([]); }
  }, [getAccessTokenSilently, API_URL]);

  const updateProfile = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/user/update`, { name: tempName, status: statusText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingProfile(false);
      fetchConversations(); 
    } catch (err) { console.error("Update failed", err); }
  };

  const startNewConversation = async (targetUser) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/conversations`, {
        receiverId: targetUser.userId || targetUser.sub
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentChat(res.data);
      setSearchQuery("");
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const handleSend = async (e, mediaUrl = null, mediaType = null) => {
    if (!newMessage.trim() && !mediaUrl) return;

    const tempId = Date.now();
    const msgData = {
      _id: tempId,
      senderId: user.sub,
      senderName: getDisplayName(user),
      text: newMessage,
      media: mediaUrl,
      mediaType: mediaType,
      conversationId: currentChat._id,
      members: currentChat.members || [],
      isSelfDestruct: isSelfDestruct,
      isPending: true 
    };

    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");

    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", msgData);

    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(m => m._id === tempId ? { ...res.data, isPending: false } : m));
      
      if (isSelfDestruct) {
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m._id !== tempId && m._id !== res.data._id));
        }, 10000);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);
    s.on("getMessage", (data) => {
      if (currentChat?._id === data.conversationId) {
        setMessages((prev) => [...prev, data]);
        if(data.isSelfDestruct) {
          setTimeout(() => setMessages(prev => prev.filter(m => m._id !== data._id)), 10000);
        }
      }
      fetchConversations();
    });
    s.on("incomingCall", (data) => setIncomingCall(data));
    return () => { s.off("getMessage"); s.off("incomingCall"); };
  }, [socket, currentChat, user, fetchConversations]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startCall = (type) => {
    if (!currentChat?.userDetails?.userId) return;
    setIsCalling(true);
    const s = socket?.current || socket;
    s.emit("callUser", {
      to: currentChat.userDetails.userId,
      from: user.sub,
      name: getDisplayName(user),
      type: type
    });
  };

  return (
    <div className={`fixed inset-0 text-white font-sans overflow-hidden z-[9999] transition-colors duration-500 ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      <div className={`flex flex-col h-full w-full ${currentChat || isCalling ? 'hidden md:flex' : 'flex'}`}>
        
        {activeTab === "settings" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto p-6 pt-12 no-scrollbar">
            <h2 className="text-3xl font-black mb-8 uppercase italic text-cyan-500 tracking-tighter">System Config</h2>
            <div className="flex flex-col items-center gap-6 mb-10">
                <div className="relative group">
                    <img src={user?.picture} className="w-28 h-28 rounded-[3rem] border-4 border-cyan-500/20 shadow-2xl shadow-cyan-500/10" alt="Me" />
                    <button className="absolute bottom-0 right-0 bg-cyan-500 p-2 rounded-full border-4 border-[#02040a] text-black">
                        <HiPlus size={20}/>
                    </button>
                </div>
                <div className="text-center w-full space-y-2">
                    {isEditingProfile ? (
                        <div className="space-y-3">
                            <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-center outline-none focus:border-cyan-500" placeholder="Display Name" />
                            <input value={statusText} onChange={(e) => setStatusText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-center outline-none focus:border-cyan-500 text-xs" placeholder="Status Signal" />
                            <button onClick={updateProfile} className="w-full bg-cyan-500 text-black py-3 rounded-2xl font-black uppercase text-xs">Save Changes</button>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold">{getDisplayName(user)}</h3>
                            <p className="text-cyan-500/60 font-black text-[10px] uppercase tracking-widest">{statusText}</p>
                            <button onClick={() => setIsEditingProfile(true)} className="text-[10px] text-zinc-500 underline uppercase mt-2">Edit Profile</button>
                        </>
                    )}
                </div>
            </div>

            {currentChat?.isGroup && (
              <div className="mt-6 p-4 bg-white/5 rounded-3xl border border-white/10 mb-10">
                <h4 className="text-[10px] font-black uppercase text-cyan-500 mb-4 tracking-widest">Squad Members</h4>
                <div className="space-y-3">
                  {currentChat.members.map((memberId) => (
                    <div key={memberId} className="flex justify-between items-center bg-black/20 p-3 rounded-2xl">
                      <span className="text-xs font-bold text-zinc-300">
                        {memberId === user.sub ? "You (Me)" : `@${memberId.slice(-6)}`}
                        {memberId === currentChat.admin && <span className="ml-2 text-[8px] bg-cyan-500 text-black px-1.5 py-0.5 rounded">ADMIN</span>}
                      </span>
                      {user.sub === currentChat.admin && memberId !== user.sub && (
                        <div className="flex gap-2">
                          <button onClick={() => promoteToAdmin(memberId)} className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg"><HiShieldCheck size={16}/></button>
                          <button onClick={() => kickMember(memberId)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><HiOutlineTrash size={16}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-[2.2rem] border border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl"><HiOutlineEyeSlash size={24}/></div>
                        <div>
                            <p className="font-bold text-sm">Incognito Mode</p>
                            <p className="text-[10px] text-zinc-500">Hide your online signal</p>
                        </div>
                    </div>
                    <button onClick={() => setIsIncognito(!isIncognito)} className={`w-12 h-6 rounded-full transition-all relative ${isIncognito ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isIncognito ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </div>
          </motion.div>
        ) : (
          <>
            <header className="p-6 pt-12 flex flex-col gap-4 bg-black/40 border-b border-white/5 backdrop-blur-3xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={user?.picture} className="w-12 h-12 rounded-2xl border-2 border-cyan-500/20" alt="Me" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#02040a] rounded-full ${isIncognito ? 'bg-purple-500' : 'bg-green-500'}`} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black italic text-cyan-500 uppercase tracking-tighter">OnyxDrift</h1>
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{getDisplayName(user)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsIncognito(!isIncognito)} className={`p-3 rounded-2xl transition-all ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
                        <HiOutlineEyeSlash size={24}/>
                    </button>
                    <button className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 active:scale-90 transition-all">
                        <HiPlus size={24}/>
                    </button>
                </div>
              </div>
              <div className="relative">
                <HiMagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 ${isSearching ? 'text-cyan-500 animate-pulse' : 'text-gray-500'}`} />
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search global signals..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 outline-none text-sm focus:border-cyan-500/30 transition-all" />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-4 mt-4">
              {searchQuery.length > 0 ? (
                <div className="space-y-2 mb-10">
                  {searchResults.map(u => (
                    <div key={u.userId} onClick={() => startNewConversation(u)} className="p-4 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-4 active:bg-cyan-500/10 transition-all">
                       <img src={u.picture || FALLBACK_AVATAR} className="w-12 h-12 rounded-xl object-cover" alt="" />
                       <div className="flex-1"><p className="font-bold text-sm">{getDisplayName(u)}</p></div>
                       <HiPlus className="text-cyan-500" size={20}/>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map(c => (
                    <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 active:bg-white/10 rounded-[2.2rem] transition-all">
                        <div className="relative">
                          <img 
                            src={c.userDetails?.avatar || c.userDetails?.picture || FALLBACK_AVATAR} 
                            className="w-14 h-14 rounded-2xl object-cover" 
                            alt="" 
                            onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-100 truncate">{c.isGroup ? c.groupName : getDisplayName(c.userDetails)}</span>
                              <HiCheckBadge className={c.unreadCount === 0 ? "text-cyan-500" : "text-zinc-600"} size={16}/>
                          </div>
                          <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage || "Start encrypted chat..."}</p>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-20 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[110] shadow-2xl">
            <button onClick={() => setActiveTab("chats")} className={`p-4 ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
            <button onClick={() => setActiveTab("groups")} className={`p-4 ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiUsers size={28} /></button>
            <button onClick={() => setActiveTab("settings")} className={`p-4 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className={`fixed inset-0 z-[200] flex flex-col ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
            <header className="p-4 pt-10 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={30}/></button>
                 <img 
                    src={currentChat.userDetails?.avatar || currentChat.userDetails?.picture || FALLBACK_AVATAR} 
                    className="w-10 h-10 rounded-xl" 
                    alt="" 
                    onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
                 />
                 <div className="min-w-0">
                    <h3 className="text-[15px] font-bold truncate">{currentChat.isGroup ? currentChat.groupName : getDisplayName(currentChat.userDetails)}</h3>
                    <p className="text-[9px] text-cyan-500 uppercase font-black flex items-center gap-1"><HiOutlineLockClosed size={10}/> E2E Encrypted</p>
                 </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => setIsSelfDestruct(!isSelfDestruct)} className={`p-3 rounded-2xl ${isSelfDestruct ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-500'}`}><HiOutlineClock size={24}/></button>
                 <button onClick={() => startCall('video')} className="p-3 text-cyan-500"><HiOutlineVideoCamera size={24}/></button>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] relative ${m.senderId === user?.sub ? (isIncognito ? 'bg-purple-600' : 'bg-cyan-600') + ' rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                    {m.text && <p className="text-sm font-medium">{m.text}</p>}
                    
                    {m.mediaType === "image" && <img src={m.media} className="rounded-xl mt-2 max-h-60 w-full object-cover" alt="Signal" />}
                    
                    {m.mediaType === "voice" && (
                      <div className="flex items-center gap-2 mt-2 bg-black/20 p-2 rounded-xl">
                        <audio controls className="h-8 w-40 filter invert"><source src={m.media} type="audio/wav" /></audio>
                      </div>
                    )}

                    {m.mediaType === "file" && (
                      <a href={m.media} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-xl mt-2">
                        <div className="p-2 bg-red-500/20 text-red-500 rounded-lg"><HiOutlinePaperAirplane className="rotate-90" size={16}/></div>
                        <span className="text-[10px] font-bold truncate w-24">Doc Signal</span>
                      </a>
                    )}

                    {m.isSelfDestruct && <HiBolt className="absolute -top-1 -right-1 text-orange-500" size={14}/>}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 pb-12 bg-black/60 backdrop-blur-md">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-[2.2rem] border border-white/10">
                 <label className="p-3 text-zinc-400 cursor-pointer hover:text-cyan-500">
                    <HiOutlinePhoto size={22}/>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                 </label>
                 <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Signal..." className="bg-transparent flex-1 px-2 outline-none text-white text-sm" />
                 
                 {!newMessage.trim() ? (
                    <button onMouseDown={startRecording} onMouseUp={stopRecording} className={`p-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10 text-zinc-400'}`}>
                       <HiMic size={22} className={isRecording ? 'text-white' : ''} />
                    </button>
                 ) : (
                    <button onClick={handleSend} className="p-4 bg-cyan-500 rounded-full">
                       <HiOutlinePaperAirplane size={22} className="-rotate-45 text-black" />
                    </button>
                 )}
              </div>
            </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {isCalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#02040a] z-[300] flex flex-col items-center justify-between py-24 px-6">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-[3rem] border-2 border-cyan-500/30 overflow-hidden p-1 shadow-2xl">
                <img 
                  src={currentChat?.userDetails?.avatar || currentChat?.userDetails?.picture || FALLBACK_AVATAR} 
                  className="w-full h-full rounded-[2.8rem] object-cover" 
                  alt="" 
                  onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
                />
              </div>
              <h2 className="mt-8 text-3xl font-black">{getDisplayName(currentChat?.userDetails)}</h2>
              <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse">Encrypted Call Active</p>
            </div>
            <button onClick={() => setIsCalling(false)} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40">
                <HiOutlinePhoneXMark size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Messenger;