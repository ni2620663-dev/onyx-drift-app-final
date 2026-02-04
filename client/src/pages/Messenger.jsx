import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { 
  HiChatBubbleLeftRight, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiOutlineEyeSlash, 
  HiUsers, HiMagnifyingGlass, HiOutlineBell
} from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

// Neural Components
import MoodSelector from "./MoodSelector";
import GroupMessenger from "./GroupMessenger";
import GroupCallScreen from "./GroupCallScreen"; 
import Notification from "./Notifications"; // Import fixed
import Settings from "./Settings";         // Import fixed

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); 
  const [selectedMood, setSelectedMood] = useState("Neural-Flow");
  const [isIncognito, setIsIncognito] = useState(false);
  const [activeCall, setActiveCall] = useState(null); 
  const [showNotification, setShowNotification] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const scrollRef = useRef();
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  /* =================🛠 HELPERS ================= */
  
  const getDisplayName = (u) => {
    if (!u) return "Unknown Drifter";
    return u.name || u.nickname || u.displayName || (u.auth0Id ? `Drifter_${u.auth0Id.slice(-4)}` : "Unknown Drifter");
  };

  const getAvatar = (u) => {
    return u?.avatar || u?.picture || `https://ui-avatars.com/api/?name=${getDisplayName(u)}&background=0D8ABC&color=fff`;
  };

  const getAuthToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (e) {
      console.error("Token Error", e);
      return null;
    }
  }, [getAccessTokenSilently]);

  /* =================📞 CALL HANDLERS (Fixed Signal) ================= */
  
  const startCall = (chat) => {
    if (!chat || !user) return;
    
    // কনভারসেশনের অন্য মেম্বারকে খুঁজে বের করা
    const receiverId = chat.members?.find(m => m !== user.sub);
    
    if (!receiverId) {
      alert("Receiver not found in this drift!");
      return;
    }

    setActiveCall({
      roomId: chat._id,
      name: getDisplayName(chat.userDetails)
    });

    // সকেট হ্যান্ডলিং ফিক্স: সিগন্যাল পাঠানোর সময় নিশ্চিত করা
    const s = socket?.current || socket;
    if (s && s.connected) {
      s.emit("initiateCall", { 
        roomId: chat._id, 
        receiverId: receiverId, 
        callerName: user.name || user.nickname,
        callerAvatar: user.picture,
        type: "video" 
      });
    } else {
      console.error("Socket not connected. Call failed.");
    }
  };

  /* =================🔍 SEARCH & CONVERSATIONS ================= */
  
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/search-users/${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setIsSearching(false);
    }
  };

  const startNewConversation = async (selectedUser) => {
    try {
      const token = await getAuthToken();
      const res = await axios.post(`${API_URL}/api/messages/conversation`, 
        { receiverId: selectedUser.auth0Id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newConv = { ...res.data, userDetails: selectedUser };
      setCurrentChat(newConv);
      setSearchQuery("");
      setSearchResults([]);
      fetchConversations();
    } catch (err) {
      console.error("Start Conv Error", err);
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Conversation Fetch Error:", err); }
  }, [getAuthToken, API_URL]);

  const fetchMessages = async (convId) => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) { console.error("Message Fetch Error:", err); }
  };

  /* =================📩 MESSAGE HANDLER ================= */
  
  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat || !user) return;
    
    const msgData = {
      senderId: user.sub,
      senderName: user.name || user.nickname || "Unknown Drifter",
      senderAvatar: user.picture,
      text: newMessage,
      conversationId: currentChat._id,
      isGroup: !!currentChat.isGroup,
      neuralMood: selectedMood,
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
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { 
      console.error("Send Error:", err.response?.data || err.message); 
    }
  };

  /* =================📡 SOCKET LISTENERS ================= */
  
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user) return;

    s.emit("addNewUser", user.sub);

    const handleNewMessage = (data) => {
      if(currentChat?._id === data.conversationId) {
        setMessages(prev => [...prev, data]);
      }
      fetchConversations();
    };

    s.on("getMessage", handleNewMessage);
    return () => s.off("getMessage", handleNewMessage);
  }, [socket, currentChat, user, fetchConversations]);

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);

  useEffect(() => { 
    if (currentChat) fetchMessages(currentChat._id);
  }, [currentChat]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const moodStyles = {
    "Enraged": "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50 bg-red-900/20",
    "Neural-Flow": "shadow-[0_0_15_px_rgba(6,182,212,0.4)] border-cyan-500/50 bg-cyan-900/20",
    "Ecstatic": "shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/50 bg-purple-900/20",
  };

  return (
    <div className={`fixed inset-0 text-white h-[100dvh] overflow-hidden ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      {/* 📞 ভিডিও কল স্ক্রিন (Overlay) */}
      <AnimatePresence>
        {activeCall && (
          <GroupCallScreen 
            roomId={activeCall.roomId} 
            callerName={activeCall.name}
            onHangup={() => setActiveCall(null)} 
          />
        )}
      </AnimatePresence>

      {/* 🔔 Notification Overlay (Side Drawer) */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="fixed inset-0 z-[300] bg-[#02040a] flex flex-col"
          >
            <header className="p-4 pt-12 flex items-center gap-4 border-b border-white/5">
              <button onClick={() => setShowNotification(false)} className="p-2 text-zinc-400"><HiOutlineChevronLeft size={24}/></button>
              <h2 className="font-bold">Neural Notifications</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <Notification />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* মেইন ভিউ */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden' : 'flex'}`}>
        <header className="p-5 pt-12 flex flex-col gap-4 bg-black/40 border-b border-white/5 backdrop-blur-3xl shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={getAvatar(user)} className="w-10 h-10 rounded-xl border border-cyan-500/30" alt="" />
              <div>
                <h1 className="text-lg font-black italic text-cyan-500 uppercase tracking-tighter">ONYXDRIFT</h1>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Neural Network Active</p>
              </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setShowNotification(true)} className="p-2.5 bg-white/5 rounded-xl text-zinc-400 hover:text-cyan-500 transition-all relative">
                 <HiOutlineBell size={20}/>
                 <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
               </button>
               <button onClick={() => setIsIncognito(!isIncognito)} className={`p-2.5 rounded-xl transition-all ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
                 <HiOutlineEyeSlash size={20}/>
               </button>
            </div>
          </div>

          {/* Search (Hide if Settings) */}
          {activeTab !== "settings" && (
            <div className="relative group">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search Drifters..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50"
              />
              <AnimatePresence>
                {searchQuery.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-[50] max-h-60 overflow-y-auto">
                    {searchResults.map(u => (
                      <div key={u.auth0Id} onClick={() => startNewConversation(u)} className="p-3 flex items-center gap-3 hover:bg-cyan-500/10 cursor-pointer border-b border-white/5 last:border-0">
                        <img src={getAvatar(u)} className="w-8 h-8 rounded-lg" alt="" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{getDisplayName(u)}</span>
                          <span className="text-[10px] text-zinc-500">{u.email}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === "chats" && (
             <div className="space-y-2">
               {conversations.map(c => (
                 <div key={c._id} onClick={() => setCurrentChat(c)} className="p-3.5 flex items-center gap-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-all bg-white/[0.02] border border-white/5 group">
                   <img src={getAvatar(c.userDetails)} className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-cyan-500/50" alt="" />
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-0.5">
                       <span className="font-bold text-sm truncate text-zinc-200">{getDisplayName(c.userDetails)}</span>
                       <span className="text-[8px] text-zinc-600 font-mono">
                         {c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'SYNC'}
                       </span>
                     </div>
                     <p className="text-xs text-zinc-500 truncate italic">{c.lastMessage?.text || "Establish connection..."}</p>
                   </div>
                 </div>
               ))}
             </div>
          )}
          {activeTab === "groups" && <GroupMessenger />}
          {activeTab === "settings" && <Settings />}
        </div>

        {/* Bottom Nav */}
        <nav className="p-4 pb-10 flex justify-around items-center bg-black/80 backdrop-blur-2xl border-t border-white/5 shrink-0">
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
            <span className="text-[8px] font-black uppercase">Settings</span>
          </button>
        </nav>
      </div>

      {/* --- চ্যাট উইন্ডো --- */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed inset-0 z-[200] flex flex-col h-[100dvh] bg-[#02040a]">
            <header className="p-3 pt-12 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl shrink-0">
               <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={28}/></button>
                 <img src={getAvatar(currentChat.userDetails)} className="w-9 h-9 rounded-lg border border-cyan-500/20" alt="" />
                 <div>
                   <h3 className="font-bold text-xs truncate max-w-[120px]">{getDisplayName(currentChat.userDetails)}</h3>
                   <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"/>
                      <p className="text-[8px] text-cyan-500 font-black uppercase">Linked</p>
                   </div>
                 </div>
               </div>
               <div className="flex gap-1">
                 <button onClick={() => startCall(currentChat)} className="text-zinc-400 p-2.5 hover:text-cyan-400 transition-colors"><FaPhone size={16}/></button>
                 <button onClick={() => startCall(currentChat)} className="text-zinc-400 p-2.5 hover:text-cyan-400 transition-colors"><HiOutlineVideoCamera size={22}/></button>
               </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] border transition-all ${m.senderId === user?.sub ? (moodStyles[m.neuralMood] || "bg-cyan-500/10 border-cyan-500/20") : "bg-white/5 border-white/10"}`}>
                    <p className="text-[13px] leading-relaxed">{m.text}</p>
                  </div>
                  <span className="text-[7px] text-zinc-600 mt-1 uppercase font-mono">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} className="h-4" />
            </div>

            <div className="p-4 pb-10 bg-black/60 backdrop-blur-xl border-t border-white/5">
              <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />
              <div className="flex items-center gap-2 mt-4 bg-white/5 p-1.5 rounded-full border border-white/10">
                <input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                  placeholder="Transmit signal..." 
                  className="bg-transparent flex-1 px-4 outline-none text-white text-[13px]" 
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="p-3 rounded-full bg-cyan-500 text-black active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <HiOutlinePaperAirplane size={18} className="-rotate-45" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;