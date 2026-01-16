import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineChatBubbleBottomCenterText, HiOutlineChevronLeft, HiPlus, HiXMark, 
  HiOutlineMusicalNote, HiLanguage, HiCheck, HiOutlineMagnifyingGlass
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
  
  const [allStories, setAllStories] = useState([]); 
  const [viewingStory, setViewingStory] = useState(null);
  const [selectedStoryFile, setSelectedStoryFile] = useState(null);
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [activeTool, setActiveTool] = useState(null); 
  const [storySettings, setStorySettings] = useState({
    filter: "none", text: "", musicName: "", musicUrl: ""
  });

  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));

  const scrollRef = useRef();
  const audioRef = useRef(new Audio());
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // --- 📡 SOCKET INITIALIZATION ---
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);

    const handleMessage = (data) => {
      // যদি ওপেন করা চ্যাট আইডি এবং আগত মেসেজের কনভারসেশন আইডি মিলে যায়
      if (currentChat?._id === data.conversationId || currentChat?.members?.includes(data.senderId)) {
        setMessages((prev) => [...prev, {
          senderId: data.senderId,
          text: data.text,
          createdAt: Date.now()
        }]);
      }
    };

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => console.log("Audio interaction required"));
    };

    s.on("getMessage", handleMessage);
    s.on("incomingCall", handleIncomingCall);

    return () => {
      s.off("getMessage", handleMessage);
      s.off("incomingCall", handleIncomingCall);
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 📞 CALLING LOGIC ---
  const acceptCall = () => {
    ringtoneRef.current.pause();
    navigate(`/call/${incomingCall.roomId}`);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    ringtoneRef.current.pause();
    setIncomingCall(null);
  };

  const handleCall = () => {
    const s = socket?.current || socket;
    if (!currentChat || !s) return;

    const receiverId = currentChat.members.find(m => m !== user.sub);
    const roomId = `drift_${Date.now()}_${user.sub.slice(-5)}`;

    s.emit("sendCallRequest", {
      senderId: user.sub,
      senderName: user.name || "Neural Drifter",
      receiverId,
      roomId
    });

    navigate(`/call/${roomId}`);
  };

  // --- 📥 API FETCHING ---
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
    const getMessages = async () => {
      if (!currentChat) return;
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) { console.error(err); }
    };
    getMessages();
  }, [currentChat, getAccessTokenSilently, API_URL]);

  // --- ✉️ MESSAGE SENDING (Error 500 Fix) ---
  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const receiverId = currentChat.members.find(m => m !== user.sub);
    const s = socket?.current || socket;

    // ১. রিয়েল টাইম আপডেট (Optimistic UI)
    const msgData = {
      senderId: user.sub,
      receiverId,
      text: newMessage,
      conversationId: currentChat._id
    };

    if (s) s.emit("sendMessage", msgData);
    setMessages((prev) => [...prev, { ...msgData, createdAt: Date.now() }]);
    setNewMessage("");

    // ২. ডাটাবেসে সেভ (ব্যাকএন্ডের রিকোয়েস্ট অনুযায়ী ডাটা পাঠানো)
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, {
        conversationId: currentChat._id,
        senderId: user.sub, // অনেক সময় ব্যাকএন্ড এটি রিকোয়েস্ট বডিতে চায়
        text: msgData.text,
        recipientId: receiverId // আপনার ব্যাকএন্ড মডেলে যদি এটি থাকে
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Message Save Failed (500):", err.response?.data || err.message);
    }
  };

  // --- 🔍 SEARCH ---
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
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
      
      {/* 📞 INCOMING CALL OVERLAY */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[95%] max-w-sm"
          >
            <div className="bg-zinc-900/90 backdrop-blur-3xl border border-cyan-500/50 p-5 rounded-3xl shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-black font-black">
                  {incomingCall.senderName?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-cyan-500">Neural Request</h4>
                  <p className="text-sm font-bold truncate w-32">{incomingCall.senderName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={rejectCall} className="p-3 bg-red-500/20 text-red-500 rounded-full border border-red-500/20"><HiXMark size={20}/></button>
                <button onClick={acceptCall} className="p-3 bg-cyan-500 text-black rounded-full animate-bounce"><HiOutlinePhone size={20}/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 SIDEBAR */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] bg-[#030712] border-r border-white/5 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black italic tracking-tighter text-cyan-500">ONYX_MESSENGER</h2>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          </div>
          
          <div className="relative mb-6">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" placeholder="SCAN_NODES..." value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-[10px] outline-none focus:border-cyan-500/50 transition-all"
            />
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl z-[100] shadow-2xl overflow-hidden">
                {searchResults.map((u) => (
                  <div key={u._id} onClick={() => startChat(u)} className="p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0">
                    <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                    <span className="text-[10px] font-black uppercase">{u.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {conversations.map((c) => (
            <div 
              key={c._id} 
              onClick={() => setCurrentChat(c)}
              className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-cyan-500 border border-white/5">
                {c._id.slice(-2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <h4 className="text-[11px] font-black uppercase">NODE_{c._id.slice(-6)}</h4>
                <p className="text-[8px] text-white/40 uppercase tracking-widest mt-1">Uplink Established</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚔️ CHAT AREA */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-[#010409] relative`}>
        {currentChat ? (
          <>
            <header className="px-6 py-5 flex justify-between items-center border-b border-white/5 backdrop-blur-md bg-black/20">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentChat(null)} className="md:hidden text-cyan-500"><HiOutlineChevronLeft size={24} /></button>
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-cyan-500">TERMINAL_ID: {currentChat._id.slice(-8)}</h3>
                  <span className="text-[7px] text-white/30 uppercase">Secure Neural Tunnel</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCall} className="p-3 bg-white/5 rounded-xl hover:text-cyan-500 transition-colors"><HiOutlinePhone size={20} /></button>
                <button onClick={handleCall} className="p-3 bg-white/5 rounded-xl hover:text-cyan-500 transition-colors"><HiOutlineVideoCamera size={20} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: m.senderId === user?.sub ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`max-w-[80%] px-5 py-3 rounded-2xl text-[12px] ${m.senderId === user?.sub ? 'bg-cyan-500 text-black font-bold' : 'bg-zinc-900 border border-white/10 text-white/80'}`}
                  >
                    {m.text}
                  </motion.div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-3 bg-white/5 p-2 pl-6 rounded-full border border-white/10 focus-within:border-cyan-500/50 transition-all">
                <input 
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="TRANSMIT_SIGNAL..." 
                  className="flex-1 bg-transparent outline-none text-xs font-bold uppercase" 
                />
                <button onClick={handleSend} className="p-4 bg-cyan-500 rounded-full text-black hover:scale-105 active:scale-95 transition-all">
                  <HiOutlinePaperAirplane size={18} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-32 h-32 border border-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
               <HiOutlineChatBubbleBottomCenterText size={48} className="text-cyan-500/20" />
            </div>
            <p className="mt-8 uppercase tracking-[1em] text-[8px] font-black text-white/20">Awaiting Neural Link</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Messenger;