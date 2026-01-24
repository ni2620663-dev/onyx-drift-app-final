import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiPlus, HiChatBubbleLeftRight, HiUsers, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiShieldCheck, HiBolt, HiSparkles, 
  HiMagnifyingGlass, // 🛠️ Fixed: Changed from HiOutlineSearch
  HiOutlinePhoneXMark, HiOutlineMicrophone, HiOutlineSpeakerWave,
  HiOutlineTrash, HiOutlineLockClosed, HiOutlineEyeSlash, HiOutlinePhoto, HiOutlineMicrophone as HiMic,
  HiOutlineClock, HiCheckBadge 
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

import CallOverlay from "../components/Messenger/CallOverlay";

// 🧠 PHASE-7: DISPLAY NAME RULE
const getDisplayName = (u) => {
  const name = u?.name?.trim();
  const fallback = u?.userId || u?.nickname || u?.sub?.slice(-6) || "Drifter";
  return name && name !== "" ? name : `@${fallback}`;
};

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

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
  const [tempName, setTempName] = useState(user?.name || "");

  // --- PHASE-9: SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- PHASE-10: PRIVACY MODES ---
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  // --- PHASE-9: GLOBAL SEARCH LOGIC ---
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

  const startNewConversation = async (targetUser) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/conversations`, {
        receiverId: targetUser.userId || targetUser.sub
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setCurrentChat(res.data);
      setSearchQuery("");
      setSearchResults([]);
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  // --- PHASE-8: UPDATE PROFILE LOGIC ---
  const updateProfile = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/user/update`, {
        name: tempName,
        status: statusText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditingProfile(false);
      fetchConversations(); 
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const getGroupMood = (conv) => {
    if (conv.isGroup) {
        const moods = ['Active 🔥', 'Chill 😌', 'Busy ⚡', 'Stable 🟢'];
        return moods[Math.floor(Math.random() * moods.length)];
    }
    return "Neural";
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setConversations([]); }
  }, [getAccessTokenSilently, API_URL]);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  // --- SOCKET REAL-TIME ---
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);
    
    s.on("getMessage", (data) => {
      if (currentChat?._id === data.conversationId) {
        setMessages((prev) => [...prev, data]);
        if(data.isSelfDestruct) {
          setTimeout(() => {
            setMessages(prev => prev.filter(m => m._id !== data._id));
          }, 10000); 
        }
      } else {
        if (Notification.permission === "granted" && document.visibilityState !== "visible") {
           new Notification(`New message from ${data.senderName}`, { body: data.text });
        }
      }
      fetchConversations();
    });

    s.on("incomingCall", (data) => setIncomingCall(data));

    return () => { 
      if (s) {
        s.off("getMessage");
        s.off("incomingCall");
      }
    };
  }, [socket, currentChat, user, fetchConversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat?._id) return;

    const tempId = Date.now();
    const msgData = {
      _id: tempId,
      senderId: user.sub,
      senderName: getDisplayName(user),
      text: newMessage,
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
    } catch (err) {
      console.error(err);
    }
  };

  const startCall = (type) => {
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
    <div className={`fixed inset-0 text-white font-sans overflow-hidden z-[9999] select-none touch-none transition-colors duration-500 ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
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
                            <h3 className="text-2xl font-bold">{tempName || getDisplayName(user)}</h3>
                            <p className="text-cyan-500/60 font-black text-[10px] uppercase tracking-widest">{statusText}</p>
                            <button onClick={() => setIsEditingProfile(true)} className="text-[10px] text-zinc-500 underline uppercase mt-2">Edit Profile</button>
                        </>
                    )}
                </div>
            </div>

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
                <div className="p-5 bg-white/5 rounded-[2.2rem] border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl"><HiShieldCheck size={24}/></div>
                    <div>
                        <p className="font-bold text-sm">End-to-End Encryption</p>
                        <p className="text-[10px] text-zinc-500">Verified & Secure Signal</p>
                    </div>
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
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{isIncognito ? "Privacy Mode ON" : "Mobile Active"}</p>
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
                {/* 🛠️ Fixed: Changed to HiMagnifyingGlass */}
                <HiMagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 ${isSearching ? 'text-cyan-500 animate-pulse' : 'text-gray-500'}`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search global signals..." 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 outline-none text-sm focus:border-cyan-500/30 transition-all" 
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-4 mt-4">
              {searchQuery.length > 0 ? (
                <div className="space-y-2 mb-10">
                  <p className="text-[10px] font-black text-cyan-500/50 uppercase ml-4 mb-2">Global Discovery</p>
                  {searchResults.map(u => (
                    <div key={u.userId} onClick={() => startNewConversation(u)} className="p-4 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-4 active:bg-cyan-500/10 transition-all">
                       <img src={u.picture} className="w-12 h-12 rounded-xl object-cover" alt="" />
                       <div className="flex-1"><p className="font-bold text-sm">{getDisplayName(u)}</p></div>
                       <HiPlus className="text-cyan-500" size={20}/>
                    </div>
                  ))}
                  {searchResults.length === 0 && !isSearching && <p className="text-center text-xs text-zinc-600 py-10 italic">No signals found for "{searchQuery}"</p>}
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-6 overflow-x-auto py-2 no-scrollbar">
                    {['Active 🔥', 'Chill 😌', 'Silent 😴', 'Busy ⚡'].map(mood => (
                      <div key={mood} className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase whitespace-nowrap active:bg-cyan-500/20 transition-colors">
                        {mood}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {conversations.map(c => (
                      <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 active:bg-white/10 rounded-[2.2rem] transition-all relative group">
                          <div className="relative">
                            <img src={c.userDetails?.avatar || c.userDetails?.picture} className="w-14 h-14 rounded-2xl object-cover border border-white/5" alt="" />
                            {c.isGroup && <div className="absolute -top-1 -right-1 bg-cyan-500 w-4 h-4 rounded-full border-2 border-[#02040a] flex items-center justify-center text-[7px] font-black">G</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-100 truncate flex items-center gap-1">
                                    {c.isGroup ? c.groupName : getDisplayName(c.userDetails)}
                                    {c.isGroup && <HiShieldCheck className="text-cyan-500" size={14}/>}
                                </span>
                                <HiCheckBadge className={c.unreadCount === 0 ? "text-cyan-500" : "text-zinc-600"} size={16}/>
                            </div>
                            <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage || "Start encrypted chat..."}</p>
                          </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-20 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[110] shadow-2xl">
           <button onClick={() => setActiveTab("chats")} className={`p-4 transition-all ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
           <button onClick={() => setActiveTab("groups")} className={`p-4 transition-all ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiUsers size={28} /></button>
           <button onClick={() => setActiveTab("settings")} className={`p-4 transition-all ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className={`fixed inset-0 z-[200] flex flex-col ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
           <header className="p-4 pt-10 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2 active:scale-75"><HiOutlineChevronLeft size={30}/></button>
                 <img src={currentChat.userDetails?.avatar || currentChat.userDetails?.picture} className="w-10 h-10 rounded-xl" alt="" />
                 <div className="min-w-0">
                    <h3 className="text-[15px] font-bold truncate flex items-center gap-1">
                        {currentChat.isGroup ? currentChat.groupName : getDisplayName(currentChat.userDetails)}
                    </h3>
                    <p className="text-[9px] text-cyan-500 uppercase font-black flex items-center gap-1">
                        <HiOutlineLockClosed size={10}/> E2E Encrypted
                    </p>
                 </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => setIsSelfDestruct(!isSelfDestruct)} className={`p-3 rounded-2xl transition-all ${isSelfDestruct ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-500'}`}>
                    <HiOutlineClock size={24}/>
                 </button>
                 <button onClick={() => startCall('video')} className="p-3 text-cyan-500 active:bg-cyan-500/10 rounded-2xl"><HiOutlineVideoCamera size={24}/></button>
              </div>
           </header>
           
           <div className={`flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar ${isIncognito ? 'bg-gradient-to-b from-purple-900/5 to-transparent' : ''}`}>
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] shadow-lg relative ${m.senderId === user?.sub ? (isIncognito ? 'bg-purple-600' : 'bg-cyan-600 shadow-cyan-900/20') + ' rounded-tr-none' : 'bg-white/10 rounded-tl-none border border-white/5'}`}>
                    <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    {m.isSelfDestruct && <HiBolt className="absolute -top-1 -right-1 text-orange-500" size={14}/>}
                    {m.isPending && <span className="absolute -bottom-4 right-2 text-[8px] text-cyan-500/50 animate-pulse italic">Transmitting...</span>}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
           </div>

           <div className="p-4 pb-12 bg-black/60 backdrop-blur-md">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-[2.2rem] border border-white/10 focus-within:border-cyan-500/30">
                 <button className="p-3 text-zinc-400 active:text-cyan-500 transition-colors"><HiOutlinePhoto size={22}/></button>
                 <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={isSelfDestruct ? "Self-destruct message..." : "Signal..."} className="bg-transparent flex-1 px-2 outline-none text-white text-sm" />
                 {newMessage.trim() ? (
                   <button onClick={handleSend} className={`p-4 rounded-full active:scale-90 shadow-lg ${isSelfDestruct ? 'bg-orange-500 shadow-orange-500/20' : isIncognito ? 'bg-purple-500 shadow-purple-500/20' : 'bg-cyan-500 shadow-cyan-500/20'}`}>
                      <HiOutlinePaperAirplane size={22} className="-rotate-45 text-black" />
                   </button>
                 ) : (
                   <button className="p-4 bg-white/10 text-zinc-400 rounded-full active:bg-cyan-500/20 active:text-cyan-500 transition-all"><HiMic size={22}/></button>
                 )}
              </div>
           </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {isCalling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#02040a] z-[300] flex flex-col items-center justify-between py-24 px-6 overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="text-center relative z-10">
              <div className="w-32 h-32 mx-auto rounded-[3rem] border-2 border-cyan-500/30 overflow-hidden p-1 shadow-2xl">
                <img src={currentChat?.userDetails?.avatar} className="w-full h-full rounded-[2.8rem] object-cover" alt="" />
              </div>
              <h2 className="mt-8 text-3xl font-black">{getDisplayName(currentChat?.userDetails)}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest">HD Signal Active</p>
              </div>
            </div>

            <div className="flex gap-1 items-end h-16 relative z-10">
              {[...Array(15)].map((_, i) => (
                <motion.div key={i} animate={{ height: [10, 40, 10] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-1 bg-cyan-500/30 rounded-full" />
              ))}
            </div>

            <div className="w-full max-w-xs grid grid-cols-2 gap-4 relative z-10">
               <button className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/10 active:bg-white/20"><HiOutlineSpeakerWave size={28}/><span className="text-[10px] font-black uppercase">Speaker</span></button>
               <button className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/10 active:bg-white/20"><HiOutlineMicrophone size={28}/><span className="text-[10px] font-black uppercase">Mute</span></button>
               <button onClick={() => setIsCalling(false)} className="col-span-2 flex items-center justify-center gap-4 p-6 bg-red-600 rounded-3xl active:scale-95 shadow-xl shadow-red-900/20"><HiOutlinePhoneXMark size={32}/><span className="font-black uppercase tracking-widest">End Call</span></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CallOverlay incomingCall={incomingCall} setIncomingCall={setIncomingCall} ringtoneRef={ringtoneRef} navigate={navigate} />
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default Messenger;