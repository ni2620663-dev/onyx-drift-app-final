import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { 
  HiChatBubbleLeftRight, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiOutlineEyeSlash, 
  HiUsers, HiMagnifyingGlass, HiOutlineBell,
  HiOutlinePhoto
} from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

// Neural Components
import MoodSelector from "./MoodSelector";
import GroupMessenger from "./GroupMessenger";
import GroupCallScreen from "./GroupCallScreen"; 
import Notification from "./Notifications";
import Settings from "./Settings";

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); 
  const [selectedMood, setSelectedMood] = useState("Neural-Flow");
  const [isIncognito, setIsIncognito] = useState(false);
  const [activeCall, setActiveCall] = useState(null); 
  const [showNotification, setShowNotification] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Search & Loading States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const scrollRef = useRef();
  const fileInputRef = useRef(null);

  // Configuration - Ensure these match your Auth0 Dashboard exactly
  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";
  const AUTH_AUDIENCE = "https://onyx-drift-api.com";

  /* =================🛠 AUTH HELPERS (The 401 Fix) ================= */
  
  const getAuthToken = useCallback(async () => {
    try {
      // 401 এরর এড়াতে audience এবং scope স্পষ্টভাবে দিন
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: AUTH_AUDIENCE,
          scope: "openid profile email",
        },
      });
    } catch (e) {
      console.error("Neural Token Acquisition Failed:", e);
      return null;
    }
  }, [getAccessTokenSilently]);

  // Axios Instance for Neural Core
  const neuralApi = useCallback(async () => {
    const token = await getAuthToken();
    return axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [getAuthToken]);

  /* =================🔍 API ACTIONS ================= */
  
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const api = await neuralApi();
      const res = await api.get("/api/messages/conversations");
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("Neural Sync Error (401 Check):", err.response?.status === 401 ? "Unauthorized - Check Auth0 Audience" : err.message); 
    }
  }, [isAuthenticated, neuralApi]);

  const fetchMessages = async (convId) => {
    setIsLoadingMessages(true);
    try {
      const api = await neuralApi();
      const res = await api.get(`/api/messages/${convId}`);
      setMessages(res.data);
    } catch (err) { 
      console.error("Neural Buffer Error:", err); 
    } finally { 
      setIsLoadingMessages(false); 
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat || !user) return;
    
    const msgData = {
      senderId: user.sub,
      senderName: user.name || user.nickname,
      senderAvatar: user.picture,
      text: newMessage,
      conversationId: currentChat._id,
      neuralMood: selectedMood,
      createdAt: new Date()
    };

    // Optimistic Update
    setMessages((prev) => [...prev, { ...msgData, _id: Date.now().toString() }]);
    setNewMessage("");

    // Socket Transmission
    const s = socket?.current || socket;
    if (s) {
      const receiverId = currentChat.members?.find(m => m !== user.sub);
      s.emit("sendMessage", { ...msgData, receiverId });
      s.emit("stopTyping", { receiverId });
    }

    try {
      const api = await neuralApi();
      await api.post("/api/messages/message", msgData);
    } catch (err) { 
      console.error("Transmission Failed:", err); 
    }
  };

  /* =================📡 SOCKET & REAL-TIME ================= */
  
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user) return;

    s.on("getMessage", (data) => {
      if(currentChat?._id === data.conversationId) {
        setMessages(prev => [...prev, data]);
      }
      fetchConversations();
    });

    s.on("displayTyping", (data) => {
      if(currentChat?._id === data.conversationId) {
        setTypingUser(data.senderName);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });

    return () => {
      s.off("getMessage");
      s.off("displayTyping");
    };
  }, [socket, currentChat, user, fetchConversations]);

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);
  useEffect(() => { if (currentChat) fetchMessages(currentChat._id); }, [currentChat]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* =================🎨 UI HELPERS ================= */
  
  const getDisplayName = (u) => u?.name || u?.nickname || "Unknown Drifter";
  const getAvatar = (u) => u?.avatar || u?.picture || `https://ui-avatars.com/api/?name=Drifter&background=random`;

  const moodStyles = {
    "Enraged": "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50 bg-red-900/20 text-red-200",
    "Neural-Flow": "shadow-[0_0_15px_rgba(6,182,212,0.4)] border-cyan-500/50 bg-cyan-900/20 text-cyan-100",
    "Ecstatic": "shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/50 bg-purple-900/20 text-purple-100",
  };

  if (authLoading) return <div className="h-screen bg-[#02040a] flex items-center justify-center text-cyan-500 font-mono italic">INITIALIZING NEURAL LINK...</div>;

  return (
    <div className={`fixed inset-0 text-white h-[100dvh] overflow-hidden transition-all duration-700 ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      <AnimatePresence>
        {activeCall && <GroupCallScreen roomId={activeCall.roomId} callerName={activeCall.name} onHangup={() => setActiveCall(null)} />}
        {showNotification && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-[300] bg-[#02040a] flex flex-col">
            <header className="p-4 pt-12 flex items-center gap-4 border-b border-white/5 bg-black/50 backdrop-blur-xl">
              <button onClick={() => setShowNotification(false)} className="p-2 text-zinc-400"><HiOutlineChevronLeft size={24}/></button>
              <h2 className="font-black uppercase tracking-widest text-sm text-cyan-500">Neural Notifications</h2>
            </header>
            <div className="flex-1 overflow-y-auto"><Notification /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden' : 'flex'}`}>
        <header className="p-5 pt-12 flex flex-col gap-4 bg-black/40 border-b border-white/5 backdrop-blur-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={getAvatar(user)} className="w-10 h-10 rounded-xl border border-cyan-500/30 object-cover" alt="Profile" />
              <div>
                <h1 className="text-lg font-black italic text-cyan-500 uppercase tracking-tighter">ONYXDRIFT</h1>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{getDisplayName(user)} • Node Active</p>
              </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setShowNotification(true)} className="p-2.5 bg-white/5 rounded-xl text-zinc-400 relative">
                 <HiOutlineBell size={20}/>
                 <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
               </button>
               <button onClick={() => setIsIncognito(!isIncognito)} className={`p-2.5 rounded-xl transition-all ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
                 <HiOutlineEyeSlash size={20}/>
               </button>
            </div>
          </div>
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Scan the grid..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50" 
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {activeTab === "chats" && conversations.map(c => (
            <motion.div 
              whileTap={{ scale: 0.98 }}
              key={c._id} 
              onClick={() => setCurrentChat(c)} 
              className="p-3.5 flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer"
            >
              <img src={getAvatar(c.userDetails)} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="Avatar" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-zinc-200">{getDisplayName(c.userDetails)}</span>
                  <span className="text-[8px] text-zinc-600 font-mono">{c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'SYNC'}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate italic">{c.lastMessage?.text || "New encrypted channel..."}</p>
              </div>
            </motion.div>
          ))}
          {activeTab === "groups" && <GroupMessenger />}
          {activeTab === "settings" && <Settings />}
        </div>

        <nav className="p-4 pb-10 flex justify-around items-center bg-black/80 backdrop-blur-2xl border-t border-white/5">
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

      {/* Chat View */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }} className="fixed inset-0 z-[200] flex flex-col bg-[#02040a]">
            <header className="p-3 pt-12 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={28}/></button>
                  <img src={getAvatar(currentChat.userDetails)} className="w-9 h-9 rounded-lg border border-cyan-500/20 object-cover" alt="User" />
                  <div>
                    <h3 className="font-bold text-xs">{getDisplayName(currentChat.userDetails)}</h3>
                    <div className="flex items-center gap-1">
                       <div className={`w-1.5 h-1.5 rounded-full ${typingUser ? 'bg-green-500 animate-bounce' : 'bg-cyan-500 animate-pulse'}`}/>
                       <p className="text-[8px] text-cyan-500 font-black uppercase tracking-widest">{typingUser ? `${typingUser} typing...` : 'Linked'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="text-zinc-400 p-2.5"><FaPhone size={16}/></button>
                  <button className="text-zinc-400 p-2.5"><HiOutlineVideoCamera size={22}/></button>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages && <div className="text-center text-[10px] text-cyan-500 animate-pulse">DECRYPTING BUFFER...</div>}
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] border transition-all duration-500 ${m.senderId === user?.sub ? (moodStyles[m.neuralMood] || "bg-cyan-500/10 border-cyan-500/20") : "bg-white/5 border-white/10"}`}>
                    <p className="text-[13px] leading-relaxed">{m.text}</p>
                  </div>
                  <span className="text-[7px] text-zinc-600 mt-1 uppercase font-mono">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 pb-10 bg-black/90 backdrop-blur-2xl border-t border-white/5">
              <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />
              <div className="flex items-center gap-2 mt-4 bg-white/5 p-1.5 pl-4 rounded-3xl border border-white/10">
                <input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                  placeholder="Transmit signal..." 
                  className="bg-transparent flex-1 outline-none text-white text-[13px]" 
                />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="p-3 rounded-full bg-cyan-500 text-black active:scale-90 disabled:opacity-30">
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