import React, { useState, useEffect, useRef } from "react";
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
import { useNavigate } from "react-router-dom";

const Messenger = () => {
  const { user } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState([]); // গ্লোবাল সার্চের জন্য
  
  const socket = useRef();
  const scrollRef = useRef();
  const ringtoneRef = useRef();
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  const glassPanel = "bg-[#030712]/60 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]";
  const neonText = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black";

  // --- Socket Logic ---
  useEffect(() => {
    socket.current = io(API_URL, { transports: ["websocket"] });

    socket.current.on("getMessage", (data) => {
      if (currentChat?.members.includes(data.senderId)) {
        setMessages((prev) => [...prev, { ...data, createdAt: Date.now() }]);
      }
    });

    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));

    socket.current.on("incomingCall", (data) => {
      setIncomingCall(data);
      ringtoneRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3");
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("Audio play blocked"));
    });

    if (user?.sub) socket.current.emit("addNewUser", user.sub);

    return () => socket.current.disconnect();
  }, [currentChat, user]);

  // --- Fetch Initial Conversations ---
  useEffect(() => {
    const fetchConv = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data || []);
      } catch (err) { console.error("Conv fetch error", err); }
    };
    if (user?.sub) fetchConv();
  }, [user]);

  // --- Search Logic (Global) ---
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

  // --- Create/Open Conversation ---
  const selectUser = async (targetUser) => {
    try {
      // চ্যাট আগে থেকে আছে কিনা চেক করা বা নতুন তৈরি করা
      const res = await axios.post(`${API_URL}/api/messages/conversation`, {
        senderId: user.sub,
        receiverId: targetUser.auth0Id
      });
      setCurrentChat(res.data);
      setSearchTerm("");
      setSearchResults([]);
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

  // --- Call/Message Logic ---
  const startCall = (type) => {
    if (!currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    socket.current.emit("callUser", {
      userToCall: receiverId,
      from: user.sub,
      fromName: user.nickname || user.name,
      type,
      roomId: currentChat._id
    });
    navigate(`/call/${currentChat._id}?type=${type}`);
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const messageBody = { conversationId: currentChat._id, senderId: user.sub, text };
    socket.current.emit("sendMessage", { senderId: user.sub, receiverId, text });
    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageBody);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const stopRingtone = () => {
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
  };

  return (
    <div className="flex h-screen bg-[#010409] text-white p-2 md:p-6 gap-2 md:gap-6 font-sans overflow-hidden fixed inset-0">
      
      {/* Side Nav */}
      <div className={`hidden md:flex w-20 ${glassPanel} rounded-[2rem] flex-col items-center py-10 gap-12 border-cyan-500/20`}>
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_cyan]">
          <HiOutlineMicrophone size={24} className="text-cyan-400" />
        </div>
        <HiOutlineChatBubbleBottomCenterText size={28} className="text-cyan-400" />
        <img src={user?.picture} className="mt-auto w-12 h-12 rounded-2xl border-2 border-cyan-500/50" />
      </div>

      {/* Chat List & Search */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] ${glassPanel} rounded-[3rem] flex flex-col overflow-hidden`}>
        <div className="p-6">
          <h2 className={`text-xl uppercase italic tracking-tighter ${neonText}`}>Neonus Channels</h2>
          <div className="mt-4 bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center">
            <HiOutlineMagnifyingGlass className="text-gray-500 mr-2" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH NEURAL ID..." 
              className="bg-transparent border-none outline-none text-[10px] w-full tracking-widest text-cyan-200" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {/* সার্চ রেজাল্ট দেখা যাবে এখানে */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] text-cyan-400 mb-2 ml-2 tracking-widest uppercase">Global Results</p>
              {searchResults.map(u => (
                <div key={u.auth0Id} onClick={() => selectUser(u)} className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 mb-2 cursor-pointer flex items-center gap-3">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} className="w-8 h-8 rounded-lg" />
                  <span className="text-xs font-bold uppercase">{u.name}</span>
                </div>
              ))}
              <hr className="border-white/5 my-4" />
            </div>
          )}

          {conversations.map((c) => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className={`p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/5'}`}>
              <div className="relative">
                <img src={`https://ui-avatars.com/api/?name=${c._id}&background=random`} className="w-12 h-12 rounded-2xl rotate-2" alt="" />
                {onlineUsers.some(u => c.members.includes(u.userId) && u.userId !== user.sub) && 
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#010409]"></div>
                }
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm truncate uppercase italic tracking-wider">Node_{c._id.slice(-4)}</h4>
                <p className="text-[9px] text-cyan-400/60 font-mono tracking-widest uppercase italic">Active Link</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 ${glassPanel} rounded-[3.5rem] flex flex-col relative`}>
        {currentChat ? (
          <>
            <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentChat(null)} className="md:hidden p-2 text-cyan-400"><HiOutlineChevronLeft size={24} /></button>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <HiOutlineUser size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black italic uppercase tracking-widest">Target_Locked</h3>
                  <p className="text-[9px] text-cyan-400 animate-pulse font-mono tracking-widest">STABLE_SIGNAL</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startCall('video')} className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/10 hover:shadow-[0_0_15px_cyan]"><HiOutlineVideoCamera size={20} /></button>
                <button onClick={() => startCall('voice')} className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/10 hover:shadow-[0_0_15px_purple]"><HiOutlinePhone size={20} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.sub;
                return (
                  <motion.div initial={{ opacity: 0, x: isMe ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-6 py-3 shadow-xl ${isMe ? 'bg-cyan-600/50 text-white rounded-l-2xl rounded-tr-2xl border border-cyan-400/30' : 'bg-white/5 border border-white/10 text-cyan-100 rounded-r-2xl rounded-tl-2xl'}`}>
                      <p className="text-sm">{m.text}</p>
                      <div className="text-[8px] mt-1 opacity-50 flex justify-end gap-1 uppercase font-mono">
                        <HiCheck size={10} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[2rem] border border-cyan-500/20">
                <button className="p-3 text-gray-500 hover:text-cyan-400"><HiOutlinePaperClip size={20} /></button>
                <input 
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(newMessage)}
                  placeholder="ENCRYPT MESSAGE..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-cyan-100 tracking-widest uppercase"
                />
                <button onClick={() => handleSend(newMessage)} className="bg-cyan-500 p-4 rounded-full text-black shadow-[0_0_15px_cyan] active:scale-90 transition-all">
                  <HiOutlinePaperAirplane size={18} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
             <HiOutlineChatBubbleBottomCenterText size={100} className="text-cyan-500" />
             <h2 className="text-xl font-black uppercase tracking-[0.5em] mt-4">Neural Idle</h2>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className={`p-10 rounded-[3rem] ${glassPanel} text-center max-w-sm w-full border-cyan-500 shadow-[0_0_50px_cyan]`}>
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 mx-auto mb-6 flex items-center justify-center animate-bounce border border-cyan-500">
                <HiOutlinePhone size={32} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-black uppercase mb-2">Neural Inlink</h2>
              <p className="text-cyan-400 font-mono mb-8 tracking-tighter truncate uppercase">{incomingCall.fromName}</p>
              <div className="flex gap-4">
                <button onClick={() => { stopRingtone(); navigate(`/call/${incomingCall.roomId}?type=${incomingCall.type}`); setIncomingCall(null); }} className="flex-1 bg-cyan-500 text-black py-4 rounded-2xl font-black uppercase shadow-[0_0_20px_cyan]">Connect</button>
                <button onClick={() => { stopRingtone(); setIncomingCall(null); }} className="flex-1 bg-red-500/20 text-red-500 border border-red-500/40 py-4 rounded-2xl font-black uppercase">Sever</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;