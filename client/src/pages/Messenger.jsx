import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiPlus, HiChatBubbleLeftRight, 
  HiUsers, HiCog6Tooth, HiOutlineChevronLeft, 
  HiOutlinePhone, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiUserGroup, 
  HiOutlinePhoto, HiXMark, HiCheck
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

import CallOverlay from "../components/Messenger/CallOverlay";

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [incomingCall, setIncomingCall] = useState(null);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]); 
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [groupName, setGroupName] = useState("");

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  /* =================📡 SOCKET LOGIC ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;
    
    s.emit("addNewUser", user.sub);

    s.on("getMessage", (data) => {
      if (currentChat?._id === data.conversationId) {
        setMessages((prev) => [...prev, data]);
      }
      fetchConversations();
    });

    s.on("incomingCall", (data) => {
        setIncomingCall(data);
        ringtoneRef.current.play().catch(() => {});
    });

    return () => {
      s.off("getMessage");
      s.off("incomingCall");
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =================📦 DATA FETCHING ================= */
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      setConversations([]);
    }
  }, [getAccessTokenSilently]);

  const fetchAllUsers = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setAllUsers(userData.filter(u => u.sub !== user?.sub)); 
    } catch (err) { 
      setAllUsers([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchConversations();
        fetchAllUsers();
    }
  }, [isAuthenticated, fetchConversations]);

  const fetchMessages = async (chatId) => {
    if(!chatId) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/message/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      setMessages([]);
    }
  };

  useEffect(() => {
    if (currentChat?._id) fetchMessages(currentChat._id);
  }, [currentChat]);

  /* =================✉️ HANDLERS ================= */
  const initiateCall = (type) => {
    if (!currentChat) return;
    const s = socket?.current || socket;
    const roomId = `room-${Date.now()}`;
    
    const callData = {
        senderId: user.sub,
        senderName: user.name || user.nickname,
        senderPic: user.picture,
        receiverId: currentChat.isGroup ? null : (currentChat.userDetails?.id || currentChat.members?.find(m => m !== user.sub)),
        members: currentChat.members || [],
        roomId: roomId,
        type: type,
        isGroup: currentChat.isGroup || false
    };
    
    if (s) s.emit(currentChat.isGroup ? "startGroupCall" : "callUser", callData);
    navigate(`/call/${roomId}?type=${type}`);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat?._id) return;

    const msgData = {
      senderId: user.sub,
      senderName: user.name || user.nickname,
      senderPic: user.picture,
      text: newMessage,
      conversationId: currentChat._id,
      isGroup: currentChat.isGroup || false,
      members: currentChat.members || []
    };

    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");

    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", msgData);

    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden z-[9999]">
      
      {/* --- MAIN SIDEBAR / CONVERSATIONS --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-6 flex justify-between items-center bg-black/40 border-b border-white/5 backdrop-blur-2xl z-20">
          <div className="flex items-center gap-4">
            <img src={user?.picture} className="w-11 h-11 rounded-full border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]" alt="" />
            <h1 className="text-2xl font-black italic text-cyan-500 uppercase tracking-tighter">OnyxDrift</h1>
          </div>
          <button onClick={() => setIsGroupModalOpen(true)} className="p-3 bg-zinc-900/50 rounded-2xl text-cyan-500 border border-white/10 active:scale-95 transition-all">
            <HiPlus size={24}/>
          </button>
        </header>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-4 space-y-2 mt-4 z-10">
          {conversations.map(c => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 hover:bg-zinc-900/60 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-white/5 group">
                <div className="relative">
                  {c.isGroup ? (
                    <div className="w-14 h-14 rounded-[1.4rem] bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400"><HiUserGroup size={28} /></div>
                  ) : (
                    <img src={c.userDetails?.avatar || c.userDetails?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${c._id}`} className="w-14 h-14 rounded-[1.4rem] object-cover border border-white/5" alt="" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-100">{c.isGroup ? c.groupName : (c.userDetails?.name || c.userDetails?.nickname || "Unknown Drifter")}</span>
                      <span className="text-[10px] text-cyan-500 font-black opacity-0 group-hover:opacity-100 transition-opacity">STABLE</span>
                  </div>
                  <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage || "Encrypted tunnel active"}</p>
                </div>
            </div>
          ))}
        </div>

        {/* 🚨 NAVIGATION BAR (FIXED) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-[#111]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[100] shadow-2xl">
           <button onClick={() => setActiveTab("chats")} className={`p-4 transition-all ${activeTab === "chats" ? 'text-cyan-500 scale-110' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={30} /></button>
           <button onClick={() => setActiveTab("groups")} className={`p-4 transition-all ${activeTab === "groups" ? 'text-cyan-500 scale-110' : 'text-zinc-600'}`}><HiUsers size={30} /></button>
           <button onClick={() => setActiveTab("settings")} className={`p-4 transition-all ${activeTab === "settings" ? 'text-cyan-500 scale-110' : 'text-zinc-600'}`}><HiCog6Tooth size={30} /></button>
        </div>
      </div>

      {/* --- CHAT INTERFACE --- */}
      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 bg-[#050505] z-[200] flex flex-col">
           <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2 active:scale-90 transition-all"><HiOutlineChevronLeft size={30}/></button>
                 <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-white/10">
                    {currentChat.isGroup ? <HiUserGroup size={24} className="m-2 text-cyan-500" /> : <img src={currentChat.userDetails?.avatar || currentChat.userDetails?.picture} className="w-full h-full object-cover" alt="" />}
                 </div>
                 <div>
                    <h3 className="text-[15px] font-bold leading-tight">{currentChat.isGroup ? currentChat.groupName : (currentChat.userDetails?.name || "Neural Link")}</h3>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] text-green-500/80 font-medium">Signal Online</span>
                    </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => initiateCall('video')} className="p-3 text-cyan-500 bg-cyan-500/10 rounded-2xl active:scale-90 transition-all"><HiOutlineVideoCamera size={24}/></button>
                 <button onClick={() => initiateCall('audio')} className="p-3 text-zinc-400 active:scale-90 transition-all"><HiOutlinePhone size={24}/></button>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] shadow-md ${m.senderId === user?.sub ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-white/5'}`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                  <span className="text-[9px] text-zinc-600 mt-1 px-2 uppercase tracking-tighter">Verified</span>
                </div>
              ))}
              <div ref={scrollRef} />
           </div>

           <div className="p-4 pb-10 bg-black/60 border-t border-white/5 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-[#111] p-2 rounded-[2.5rem] border border-white/10 focus-within:border-cyan-500/50 transition-all shadow-inner">
                 <input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Transmit encrypted signal..." 
                    className="bg-transparent flex-1 px-4 outline-none text-sm text-white placeholder:text-zinc-700" 
                 />
                 <button onClick={() => handleSend()} className="p-3.5 bg-cyan-500 text-black rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-90 transition-all">
                    <HiOutlinePaperAirplane size={22} className="-rotate-45" />
                 </button>
              </div>
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