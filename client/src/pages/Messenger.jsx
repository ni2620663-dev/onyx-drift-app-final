import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineUser, HiCheck, HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleBottomCenterText, HiOutlineMicrophone,
  HiOutlinePaperClip, HiOutlineChevronLeft
} from "react-icons/hi2";
import { useNavigate, useLocation } from "react-router-dom";

const Messenger = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  
  const socket = useRef();
  const scrollRef = useRef();
  const ringtoneRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  const glassPanel = "bg-[#030712]/60 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]";
  const neonText = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black";

  // --- Socket.io Setup ---
  useEffect(() => {
    socket.current = io(API_URL, { transports: ["websocket"] });

    socket.current.on("getMessage", (data) => {
      setMessages((prev) => {
        const isAlreadyAdded = prev.some(m => m._id === data._id);
        if (isAlreadyAdded) return prev;
        return [...prev, { ...data, createdAt: Date.now() }];
      });
    });

    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));

    socket.current.on("incomingCall", (data) => {
      setIncomingCall(data);
      ringtoneRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3");
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("Audio play blocked"));
    });

    if (user?.sub) socket.current.emit("addNewUser", user.sub);

    return () => {
      socket.current.disconnect();
      if (ringtoneRef.current) ringtoneRef.current.pause();
    };
  }, [user]);

  // --- Fetch Conversations ---
  const fetchConv = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data || []);
    } catch (err) { console.error("Conv fetch error", err); }
  }, [user, getAccessTokenSilently]);

  useEffect(() => { if (user?.sub) fetchConv(); }, [user, fetchConv]);

  // --- 🛰️ URL ID Sync & Clean (প্রোফাইল থেকে আসলে কাজ করবে) ---
  useEffect(() => {
    const syncUrlUser = async () => {
      const queryParams = new URLSearchParams(location.search);
      const targetUserId = queryParams.get("userId");

      if (targetUserId && user?.sub) {
        try {
          const token = await getAccessTokenSilently();
          const res = await axios.post(`${API_URL}/api/messages/conversation`, {
            senderId: user.sub,
            receiverId: targetUserId
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setCurrentChat(res.data);
          setSearchTerm("");
          // ✅ আইডি পাওয়ার পর ইউআরএল ক্লিন করে ফেলুন যাতে রিফ্রেশে ঝামেলা না হয়
          navigate('/messenger', { replace: true }); 
        } catch (err) {
          console.error("URL Sync Error", err);
        }
      }
    };
    syncUrlUser();
  }, [location.search, user, getAccessTokenSilently, navigate]);

  // --- Search Logic ---
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/user/search?query=${searchTerm}`);
        setSearchResults(res.data);
      } catch (err) { console.error("Search error", err); }
    };
    const delayDebounceFn = setTimeout(() => searchUsers(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // --- Manual Select User ---
  const selectUser = async (target) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/conversation`, {
        senderId: user.sub,
        receiverId: target.auth0Id
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setCurrentChat(res.data);
      setSearchTerm("");
      setSearchResults([]);
      fetchConv();
    } catch (err) { console.error("Chat init error", err); }
  };

  useEffect(() => {
    if (currentChat) {
      const fetchMsgs = async () => {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat._id}`);
        setMessages(res.data);
      };
      fetchMsgs();
    }
  }, [currentChat]);

  const handleSend = async (text) => {
    if (!text.trim() || !currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const messageBody = { conversationId: currentChat._id, senderId: user.sub, text };
    
    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageBody);
      socket.current.emit("sendMessage", { ...res.data, receiverId });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  const startCall = (type) => {
    if (!currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    socket.current.emit("callUser", {
      userToCall: receiverId,
      from: user.sub,
      fromName: user.name,
      type,
      roomId: currentChat._id
    });
    navigate(`/call/${currentChat._id}?type=${type}`);
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const stopRingtone = () => {
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
  };

  return (
    <div className="flex h-screen bg-[#010409] text-white p-2 md:p-6 gap-2 md:gap-6 font-sans overflow-hidden fixed inset-0">
      
      {/* 🚀 Side Nav */}
      <div className={`hidden md:flex w-20 ${glassPanel} rounded-[2rem] flex-col items-center py-10 gap-12 border-cyan-500/20`}>
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_cyan]">
          <HiOutlineMicrophone size={24} className="text-cyan-400" />
        </div>
        <HiOutlineChatBubbleBottomCenterText size={28} className="text-cyan-400 cursor-pointer" onClick={() => {setCurrentChat(null); navigate('/messenger');}} />
        <img src={user?.picture} className="mt-auto w-12 h-12 rounded-2xl border-2 border-cyan-500/50 hover:scale-110 transition-transform cursor-pointer" onClick={() => navigate('/feed')} alt="Profile" />
      </div>

      {/* 📡 Chat List & Search */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] ${glassPanel} rounded-[3rem] flex flex-col overflow-hidden`}>
        <div className="p-6">
          <h2 className={`text-xl uppercase italic tracking-tighter ${neonText}`}>Neonus Channels</h2>
          <div className="mt-4 bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center group focus-within:border-cyan-500/40 transition-all">
            <HiOutlineMagnifyingGlass className="text-gray-500 mr-2 group-focus-within:text-cyan-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH NEURAL ID..." 
              className="bg-transparent border-none outline-none text-[10px] w-full tracking-widest text-cyan-200" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
          {searchResults.length > 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] text-cyan-400 mb-2 ml-2 tracking-widest uppercase font-black">Detected Drifters</p>
              {searchResults.map(u => (
                <div key={u.auth0Id} onClick={() => selectUser(u)} className="p-3 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-2xl border border-cyan-500/10 mb-2 cursor-pointer flex items-center gap-3 transition-all">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-lg" alt={u.name} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase italic">{u.name}</span>
                    <span className="text-[8px] text-cyan-400/50 uppercase">Neural Link Available</span>
                  </div>
                </div>
              ))}
              <hr className="border-white/5 my-4" />
            </div>
          )}

          {conversations.length > 0 ? conversations.map((c) => {
            const isOnline = onlineUsers.some(u => c.members.includes(u.userId) && u.userId !== user.sub);
            return (
              <div 
                key={c._id} 
                onClick={() => {
                  // ✅ ফিক্স: এখানে navigate সরানো হয়েছে যাতে পেজ রিলোড না হয়
                  setCurrentChat(c); 
                }} 
                className={`p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all duration-300 ${currentChat?._id === c._id ? 'bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="relative">
                  <img src={`https://ui-avatars.com/api/?name=${c._id}&background=random&color=fff`} className="w-12 h-12 rounded-2xl rotate-2" alt="Node" />
                  {isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#010409] animate-pulse shadow-[0_0_10px_cyan]"></div>}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm truncate uppercase italic tracking-wider">Node_{c._id.slice(-6)}</h4>
                  <p className={`text-[9px] font-mono tracking-widest uppercase italic ${isOnline ? 'text-cyan-400' : 'text-gray-600'}`}>
                    {isOnline ? 'Stable Connection' : 'Signal Lost'}
                  </p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-10 opacity-20">
               <HiOutlineChatBubbleBottomCenterText size={40} className="mx-auto" />
               <p className="text-[9px] mt-2 uppercase font-black">No active channels</p>
            </div>
          )}
        </div>
      </div>

      {/* ⚔️ Main Chat Area */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 ${glassPanel} rounded-[3.5rem] flex flex-col relative overflow-hidden`}>
        {currentChat ? (
          <>
            <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentChat(null)} className="md:hidden p-2 text-cyan-400"><HiOutlineChevronLeft size={24} /></button>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <HiOutlineUser size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black italic uppercase tracking-widest">Target_ID: {currentChat._id.slice(-6)}</h3>
                  <p className="text-[9px] text-cyan-400 animate-pulse font-mono tracking-widest uppercase">Encryption Active</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startCall('video')} className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/10 hover:shadow-[0_0_20px_cyan] transition-all"><HiOutlineVideoCamera size={20} /></button>
                <button onClick={() => startCall('voice')} className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/10 hover:shadow-[0_0_20px_purple] transition-all"><HiOutlinePhone size={20} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.sub;
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-6 py-3 shadow-2xl ${isMe ? 'bg-cyan-600/30 text-white rounded-l-[1.5rem] rounded-tr-[1.5rem] border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]' : 'bg-white/5 border border-white/10 text-cyan-100 rounded-r-[1.5rem] rounded-tl-[1.5rem]'}`}>
                      <p className="text-[13px] leading-relaxed font-medium">{m.text}</p>
                      <div className="text-[8px] mt-2 opacity-50 flex justify-end gap-1 uppercase font-black tracking-tighter">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <HiCheck size={10} className="text-cyan-400" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 bg-white/[0.01]">
              <div className="flex items-center gap-3 bg-[#0a0f1a] p-2 rounded-[2rem] border border-white/10 focus-within:border-cyan-500/50 transition-all">
                <button className="p-3 text-gray-500 hover:text-cyan-400 transition-colors"><HiOutlinePaperClip size={20} /></button>
                <input 
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(newMessage)}
                  placeholder="ENCRYPT NEURAL SIGNAL..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-cyan-100 tracking-widest uppercase placeholder:text-gray-700"
                />
                <button onClick={() => handleSend(newMessage)} className="bg-cyan-500 p-4 rounded-full text-black shadow-[0_0_20px_cyan] hover:scale-105 active:scale-90 transition-all">
                  <HiOutlinePaperAirplane size={18} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
             <div className="relative mb-6">
                <HiOutlineChatBubbleBottomCenterText size={100} className="text-cyan-500 opacity-20" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
                </motion.div>
             </div>
             <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white opacity-40">Neural Idle</h2>
             <p className="text-[10px] text-cyan-400/30 uppercase mt-2 tracking-widest font-bold">Select a node or search for an identity to establish a secure link</p>
          </div>
        )}
      </div>

      {/* 🔔 Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
            <div className={`p-10 rounded-[4rem] ${glassPanel} text-center max-w-sm w-full border-cyan-500 shadow-[0_0_100px_rgba(6,182,212,0.3)] animate-in zoom-in-95`}>
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center">
                  <HiOutlinePhone size={40} className="text-cyan-400 animate-bounce" />
                </div>
              </div>
              <h2 className="text-2xl font-black uppercase mb-2 tracking-tighter italic">Incoming Link</h2>
              <p className="text-cyan-400 font-mono mb-10 tracking-widest truncate uppercase text-xs">{incomingCall.fromName}</p>
              <div className="flex flex-col gap-4">
                <button onClick={() => { stopRingtone(); navigate(`/call/${incomingCall.roomId}?type=${incomingCall.type}`); setIncomingCall(null); }} className="w-full bg-cyan-500 text-black py-5 rounded-3xl font-black uppercase shadow-[0_0_30px_cyan] hover:scale-105 transition-all">Connect</button>
                <button onClick={() => { stopRingtone(); setIncomingCall(null); }} className="w-full bg-red-500/10 text-red-500 border border-red-500/40 py-5 rounded-3xl font-black uppercase hover:bg-red-500/20 transition-all">Sever Connection</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.3); }
      `}</style>
    </div>
  );
};

export default Messenger;