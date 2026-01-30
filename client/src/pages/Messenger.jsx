import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiChatBubbleLeftRight, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiOutlineEyeSlash, HiOutlinePhoto,
  HiOutlineClock
} from "react-icons/hi2";
import { FaLock } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

// 🚀 Neural Components
import TimeVaultPicker from "./TimeVaultPicker";
import MoodSelector from "./MoodSelector";

const getDisplayName = (u) => {
  if (!u) return "Drifter";
  return u.name || u.nickname || u.username || (u.email ? u.email.split('@')[0] : "Unknown");
};

const getAvatar = (u) => {
  if (u?.picture || u?.avatar) return u.picture || u.avatar;
  const name = getDisplayName(u);
  return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(name)}`;
};

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  // States
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [capsuleDate, setCapsuleDate] = useState(null);
  const [selectedMood, setSelectedMood] = useState("Neural-Flow");
  const [isIncognito, setIsIncognito] = useState(false);
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);

  // 📈 Progress Logic State
  const [messageCount, setMessageCount] = useState(0); 

  const scrollRef = useRef();
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  // 🏅 Neural Rank Config
  const getRankBadge = (score = 0) => {
    if (score >= 5000) return { label: "Neural Overlord", color: "text-purple-500", icon: "🌌" };
    if (score >= 2000) return { label: "Time Architect", color: "text-cyan-400", icon: "⏳" };
    if (score >= 500) return { label: "Signal Voyager", color: "text-green-400", icon: "🛰️" };
    return { label: "Novice Drifter", color: "text-zinc-500", icon: "🌑" };
  };

  const getAuthToken = useCallback(async () => {
    return await getAccessTokenSilently({
      authorizationParams: { audience: "https://onyx-drift-api.com" },
    });
  }, [getAccessTokenSilently]);

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

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      senderId: user.sub,
      senderName: getDisplayName(user),
      text: newMessage,
      conversationId: currentChat._id,
      isSelfDestruct: isSelfDestruct,
      isTimeCapsule: !!capsuleDate,
      deliverAt: capsuleDate || new Date(),
      neuralMood: selectedMood,
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, { ...msgData, _id: Date.now().toString() }]);
    setNewMessage("");
    setCapsuleDate(null);

    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", { ...msgData, receiverId: currentChat.userDetails?.userId });

    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🚀 100 Messages = 1 Rank Point Logic
      const nextCount = messageCount + 1;
      if (nextCount >= 100) {
        await axios.patch(`${API_URL}/api/users/update-rank`, { points: 1 }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessageCount(0); 
      } else {
        setMessageCount(nextCount);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (currentChat?._id) fetchMessages(currentChat._id); }, [currentChat, fetchMessages]);
  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const moodStyles = {
    "Enraged": "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50 bg-red-900/20",
    "Ecstatic": "shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/50 bg-purple-900/20",
    "Neural-Flow": "shadow-[0_0_15px_rgba(6,182,212,0.4)] border-cyan-500/50 bg-cyan-900/20",
    "Sad": "shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-500/50 bg-blue-900/20",
    "Excited": "shadow-[0_0_15px_rgba(234,179,8,0.4)] border-yellow-500/50 bg-yellow-900/20",
  };

  return (
    <div className={`fixed inset-0 text-white transition-colors duration-500 ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header with Rank & Progress Bar */}
        <header className="p-6 pt-12 flex flex-col gap-4 bg-black/40 border-b border-white/5 backdrop-blur-3xl relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={getAvatar(user)} className="w-12 h-12 rounded-2xl border-2 border-cyan-500/20" alt="" />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black italic text-cyan-500 tracking-tighter">ONYXDRIFT</h1>
                  <span>{getRankBadge(user?.neuralRank).icon}</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  ID: {user?.sub?.slice(-8)} | {getDisplayName(user)}
                </p>
              </div>
            </div>
            <button onClick={() => setIsIncognito(!isIncognito)} className={`p-3 rounded-2xl ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
              <HiOutlineEyeSlash size={24}/>
            </button>
          </div>

          {/* 📊 Neural Progress Bar UI */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-end">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Neural Sync Progress</span>
              <span className="text-[9px] font-mono text-cyan-500/80">{messageCount}/100 Signals</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${messageCount}%` }}
                className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              />
            </div>
          </div>
        </header>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-2">
          {conversations.map(c => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 hover:bg-white/5 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-white/5">
              <img src={getAvatar(c.userDetails)} className="w-14 h-14 rounded-2xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold truncate">{getDisplayName(c.userDetails)}</span>
                  <span className="text-[9px] text-zinc-600 font-mono">RANK_{c.userDetails?.neuralRank || 0}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{c.lastMessage?.text || "Awaiting signal..."}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="p-6 flex justify-around items-center bg-black/80 backdrop-blur-2xl border-t border-white/5">
          <button onClick={() => setActiveTab("chats")} className={`p-4 ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
          <button onClick={() => setActiveTab("settings")} className={`p-4 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      {/* 🟢 ACTIVE CHAT WINDOW */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className={`fixed inset-0 z-[200] flex flex-col ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
            <header className="p-4 pt-10 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={30}/></button>
                <img src={getAvatar(currentChat.userDetails)} className="w-10 h-10 rounded-xl" alt="" />
                <div>
                  <h3 className="font-bold text-sm">{getDisplayName(currentChat.userDetails)}</h3>
                  <p className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Secure Link Established</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsSelfDestruct(!isSelfDestruct)} className={`p-2 rounded-xl ${isSelfDestruct ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-500'}`}><HiOutlineClock size={22}/></button>
                <button className="text-zinc-500 p-2"><HiOutlineVideoCamera size={22}/></button>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m, i) => {
                const isLocked = m.isTimeCapsule && new Date() < new Date(m.deliverAt);
                const moodClass = moodStyles[m.neuralMood] || "bg-white/10";
                const isMe = m.senderId === user?.sub;

                return (
                  <div key={m._id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {isLocked ? (
                      <div className="flex items-center gap-3 bg-zinc-900/50 border border-dashed border-zinc-700 p-4 rounded-2xl">
                        <FaLock className="text-cyan-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">Encrypted Vault: {new Date(m.deliverAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] border transition-all duration-500 ${moodClass} ${isMe ? 'rounded-tr-none border-white/10' : 'rounded-tl-none border-white/5'}`}>
                        {m.text && <p className="text-sm leading-relaxed">{m.text}</p>}
                        <div className="flex items-center justify-between mt-1 gap-4">
                          <span className="text-[7px] opacity-40 uppercase font-black tracking-widest">{m.neuralMood}</span>
                          <span className="text-[7px] opacity-30 font-mono">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pb-12 bg-black/60 backdrop-blur-xl border-t border-white/5">
              <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />
              <div className="flex items-center gap-2 mt-4 bg-white/5 p-2 rounded-[2.2rem] border border-white/10 relative">
                {capsuleDate && (
                  <div className="absolute -top-7 left-10 bg-cyan-600 text-[9px] px-3 py-1 rounded-full animate-pulse font-bold">
                    VAULT ACTIVE
                  </div>
                )}
                <button className="p-3 text-zinc-400"><HiOutlinePhoto size={22}/></button>
                <TimeVaultPicker onSelectTime={(date) => setCapsuleDate(date)} />
                <input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={capsuleDate ? "Message for the future..." : "Type signal..."} 
                  className="bg-transparent flex-1 px-2 outline-none text-white text-sm" 
                />
                <button 
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className={`p-4 rounded-full transition-all ${newMessage.trim() ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/10 text-zinc-600'}`}
                >
                  <HiOutlinePaperAirplane size={22} className="-rotate-45" />
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