import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineChatBubbleBottomCenterText, HiOutlineChevronLeft, HiPlus, HiXMark, 
  HiOutlineMusicalNote, HiLanguage, HiCheck, HiOutlineMagnifyingGlass,
  HiOutlineLockClosed
} from "react-icons/hi2";

const Messenger = ({ socket }) => { 
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]); 
  const [isTyping, setIsTyping] = useState(false);
  
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));

  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /* ==========================================================
      📡 SOCKET LOGIC (Real-time Sync)
  ========================================================== */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    // ইউজারকে সকেটে রেজিস্টার করা
    s.emit("addNewUser", user.sub);

    // ১. নতুন মেসেজ রিসিভ করা (Duplicate Check সহ)
    const handleMessage = (data) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(m => (m.tempId && m.tempId === data.tempId) || (m._id && m._id === data._id));
        if (isDuplicate) return prev;
        return [...prev, data];
      });
    };

    // ২. টাইপিং ইন্ডিকেটর হ্যান্ডেল করা
    const handleTyping = (data) => {
      if (currentChat?.members?.includes(data.senderId)) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    // ৩. ইনকামিং কল হ্যান্ডেল করা
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("User interaction needed for audio"));
    };

    s.on("getMessage", handleMessage);
    s.on("displayTyping", handleTyping);
    s.on("incomingCall", handleIncomingCall);

    return () => {
      s.off("getMessage", handleMessage);
      s.off("displayTyping", handleTyping);
      s.off("incomingCall", handleIncomingCall);
    };
  }, [socket, currentChat, user]);

  // মেসেজ আসলে স্ক্রল নিচে নেওয়া
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ==========================================================
      ✉️ MESSAGE HANDLERS
  ========================================================== */
  const handleTypingEvent = () => {
    const s = socket?.current || socket;
    if (!s || !currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    s.emit("typing", { senderId: user.sub, receiverId });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const receiverId = currentChat.members.find(m => m !== user.sub);
    const s = socket?.current || socket;
    const tempId = `temp_${Date.now()}`;

    const msgData = {
      tempId,
      senderId: user.sub,
      receiverId,
      text: newMessage,
      conversationId: currentChat._id,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI Update (তাত্ক্ষণিক মেসেজ দেখানো)
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");

    // সকেটে পাঠানো
    if (s) s.emit("sendMessage", msgData);

    // ডাটাবেসে সেভ করা
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Server sync failed:", err);
    }
  };

  /* ==========================================================
      📞 CALLING LOGIC
  ========================================================== */
  const handleCall = (type) => {
    const s = socket?.current || socket;
    if (!currentChat || !s) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const roomId = `onyx_${Date.now()}_${user.sub.slice(-4)}`;
    
    s.emit("sendCallRequest", { 
      senderId: user.sub, 
      senderName: user.name, 
      receiverId, 
      roomId,
      type 
    });
    navigate(`/call/${roomId}`);
  };

  /* ==========================================================
      📥 DATA FETCHING
  ========================================================== */
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.error("Fetch Conversations Error:", err); }
  }, [getAccessTokenSilently, API_URL]);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) { console.error("Fetch Messages Error:", err); }
    };
    fetchMessages();
  }, [currentChat, getAccessTokenSilently, API_URL]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/user/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const startChat = async (targetUser) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/conversation`, 
        { receiverId: targetUser.auth0Id || targetUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentChat(res.data);
      setSearchQuery("");
      setSearchResults([]);
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen bg-[#010409] text-white font-mono overflow-hidden fixed inset-0">
      
      {/* 📞 INCOMING CALL UI */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[95%] max-w-sm">
            <div className="bg-zinc-900/90 backdrop-blur-3xl border border-cyan-500/50 p-5 rounded-3xl shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-black font-black uppercase">{incomingCall.senderName?.charAt(0)}</div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-cyan-500 animate-pulse tracking-widest">Neural Link Request</h4>
                  <p className="text-sm font-bold truncate w-32">{incomingCall.senderName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { ringtoneRef.current.pause(); setIncomingCall(null); }} className="p-3 bg-red-500/10 text-red-500 rounded-full border border-red-500/20"><HiXMark size={20}/></button>
                <button onClick={() => { ringtoneRef.current.pause(); navigate(`/call/${incomingCall.roomId}`); setIncomingCall(null); }} className="p-3 bg-cyan-500 text-black rounded-full animate-bounce shadow-lg shadow-cyan-500/40"><HiOutlinePhone size={20}/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 SIDEBAR */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] bg-[#030712] border-r border-white/5 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">ONYX_MESSENGER</h2>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          </div>
          
          <div className="relative mb-6">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" placeholder="SCAN_NODES..." value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-bold tracking-widest outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl z-[100] shadow-2xl overflow-hidden">
                  {searchResults.map((u) => (
                    <div key={u._id} onClick={() => startChat(u)} className="p-4 flex items-center gap-4 hover:bg-cyan-500/10 cursor-pointer group">
                      <img src={u.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.name}`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase group-hover:text-cyan-400">{u.name}</span>
                        <span className="text-[8px] text-white/20">NODE_{u.auth0Id?.slice(-5)}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {conversations.map((c) => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className={`p-5 rounded-[2rem] flex items-center gap-5 cursor-pointer transition-all border ${currentChat?._id === c._id ? 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/5' : 'hover:bg-white/5 border-transparent'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs border ${currentChat?._id === c._id ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-zinc-800 text-white/20 border-white/5'}`}>
                {c._id.slice(-2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <h4 className={`text-[11px] font-black uppercase tracking-tight ${currentChat?._id === c._id ? 'text-cyan-400' : 'text-white/80'}`}>Node_{c._id.slice(-6)}</h4>
                <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold mt-1">Status: Uplink Secure</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚔️ CHAT AREA */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-[#010409] relative`}>
        {currentChat ? (
          <>
            <header className="px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md bg-black/40 z-10">
              <div className="flex items-center gap-5">
                <button onClick={() => setCurrentChat(null)} className="md:hidden text-cyan-500"><HiOutlineChevronLeft size={24} /></button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">Terminal_{currentChat._id.slice(-8)}</h3>
                    <HiOutlineLockClosed className="text-white/20" size={12} />
                  </div>
                  <span className="text-[8px] text-white/20 uppercase font-bold mt-1 tracking-widest">End-to-End Quantum Encryption</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleCall('voice')} className="p-4 bg-white/5 rounded-2xl hover:bg-cyan-500 hover:text-black transition-all active:scale-90 border border-white/5"><HiOutlinePhone size={20} /></button>
                <button onClick={() => handleCall('video')} className="p-4 bg-white/5 rounded-2xl hover:bg-cyan-500 hover:text-black transition-all active:scale-90 border border-white/5"><HiOutlineVideoCamera size={20} /></button>
              </div>
            </header>

            {/* Messages Area */}
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/5 via-transparent to-transparent">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`max-w-[75%] px-6 py-4 rounded-[2rem] text-[13px] leading-relaxed shadow-2xl border ${m.senderId === user?.sub ? 'bg-cyan-500 border-cyan-400 text-black font-bold rounded-tr-none' : 'bg-[#0d1117] border-white/10 text-white/90 rounded-tl-none'}`}
                  >
                    {m.text}
                    <div className={`text-[8px] mt-2 font-black uppercase opacity-40 ${m.senderId === user?.sub ? 'text-black text-right' : 'text-white'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                </div>
              ))}
              
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[9px] font-black uppercase text-cyan-500/60 tracking-widest">Neural activity detected...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 bg-black/60 backdrop-blur-2xl border-t border-white/5">
              <div className="flex items-center gap-4 bg-white/5 p-3 pl-8 rounded-[3rem] border border-white/10 focus-within:border-cyan-500/50 focus-within:bg-white/10 transition-all group">
                <input 
                  value={newMessage} 
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTypingEvent();
                  }} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="TRANSMIT_SIGNAL..." 
                  className="flex-1 bg-transparent outline-none text-[11px] font-black uppercase tracking-widest placeholder:text-white/10" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!newMessage.trim()}
                  className="p-5 bg-cyan-500 rounded-full text-black hover:scale-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/40 disabled:opacity-20"
                >
                  <HiOutlinePaperAirplane size={22} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse" />
              <HiOutlineChatBubbleBottomCenterText size={80} className="text-white/5 animate-bounce" />
            </div>
            <p className="mt-10 uppercase tracking-[1.5em] text-[10px] font-black text-white/10">Awaiting Neural Link</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.3); }
      `}</style>
    </div>
  );
};

export default Messenger;