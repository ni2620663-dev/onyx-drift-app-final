import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineFaceSmile, HiOutlineUser, HiCheck, HiOutlineMagnifyingGlass,
  HiOutlineCamera, HiOutlineChatBubbleBottomCenterText, HiOutlineMicrophone,
  HiOutlinePaperClip
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
  
  const socket = useRef();
  const scrollRef = useRef();
  const ringtoneRef = useRef();
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // Glassmorphism Styles
  const glassPanel = "bg-[#030712]/60 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_0_30px_rgba(0,255,255,0.05)]";
  const neonText = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black";

  // Socket Logic & Ringtone
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

    return () => socket.current.disconnect();
  }, [currentChat]);

  useEffect(() => {
    if (user?.sub) socket.current.emit("addNewUser", user.sub);
  }, [user]);

  // Fetch Conversations
  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
      setConversations(res.data || []);
    };
    if (user?.sub) fetch();
  }, [user]);

  // Fetch Messages
  useEffect(() => {
    if (currentChat) {
      const fetchMsgs = async () => {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat._id}`);
        setMessages(res.data);
      };
      fetchMsgs();
    }
  }, [currentChat]);

  // Handle Send Message & Files
  const handleSend = async (text, fileUrl = null) => {
    if (!text.trim() && !fileUrl) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    
    const messageBody = {
      conversationId: currentChat._id,
      senderId: user.sub,
      text: fileUrl || text,
    };

    socket.current.emit("sendMessage", { senderId: user.sub, receiverId, text: fileUrl || text });

    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageBody);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  // File Upload Logic
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      handleSend("", res.data.url);
    } catch (err) { alert("Upload failed"); }
    finally { setIsUploading(false); }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-cyan-50 p-6 gap-6 font-sans overflow-hidden w-full fixed inset-0">
      
      {/* ১. লেফট সাইড নেভিগেশন */}
      <div className={`w-20 ${glassPanel} rounded-[2rem] flex flex-col items-center py-10 gap-12`}>
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_20px_cyan] border border-cyan-500/30">
          <HiOutlineMicrophone size={24} className="text-cyan-400" />
        </div>
        <HiOutlineChatBubbleBottomCenterText size={28} className="text-gray-500 hover:text-cyan-400 cursor-pointer transition-all" />
        <HiOutlineUser size={28} className="text-gray-500 hover:text-cyan-400 cursor-pointer transition-all" />
        <div className="mt-auto group cursor-pointer">
          <img src={user?.picture} className="w-12 h-12 rounded-2xl border-2 border-cyan-500/50 group-hover:border-cyan-400 transition-all shadow-lg" alt="" />
        </div>
      </div>

      {/* ২. চ্যাট লিস্ট */}
      <div className={`w-full md:w-[380px] ${glassPanel} rounded-[3rem] flex flex-col overflow-hidden ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8">
          <h2 className={`text-2xl uppercase italic tracking-tighter ${neonText}`}>Neonus Channels</h2>
          <div className="mt-6 bg-white/5 p-3 rounded-2xl border border-cyan-500/10 flex items-center">
            <HiOutlineMagnifyingGlass className="text-cyan-500/50" />
            <input placeholder="SEARCH FREQUENCY..." className="bg-transparent border-none outline-none text-[10px] w-full px-4 tracking-[0.2em] text-cyan-200" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
          {conversations.map((c) => (
            <motion.div 
              key={c._id} whileHover={{ scale: 1.02 }} onClick={() => setCurrentChat(c)}
              className={`p-5 rounded-[2.5rem] flex items-center gap-5 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="relative">
                <img src={`https://ui-avatars.com/api/?name=${c._id}&background=random`} className="w-14 h-14 rounded-2xl rotate-3 shadow-lg" alt="" />
                {onlineUsers.some(u => c.members.includes(u.userId) && u.userId !== user.sub) && 
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#020617] shadow-[0_0_10px_cyan]"></div>
                }
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-white uppercase italic tracking-wider">Channel_{c._id.slice(-4)}</h4>
                <p className="text-[9px] text-cyan-400/60 font-mono tracking-widest uppercase">Encrypted</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ৩. মেইন চ্যাট এরিয়া */}
      <div className={`flex-1 ${glassPanel} rounded-[3.5rem] flex flex-col relative ${!currentChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {currentChat ? (
          <>
            <header className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-5">
                <img src={`https://ui-avatars.com/api/?name=${currentChat._id}`} className="w-14 h-14 rounded-2xl border-2 border-cyan-500/20 shadow-xl" />
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-[0.1em] text-white">Aura_Node_{currentChat._id.slice(-4)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                    <span className="text-[10px] text-cyan-400 font-mono tracking-[0.3em] uppercase">Link_Stable</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => navigate(`/call/${currentChat._id}?type=video`)} className="p-4 bg-cyan-500/10 rounded-2xl hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 shadow-lg"><HiOutlineVideoCamera size={26} /></button>
                <button onClick={() => navigate(`/call/${currentChat._id}?type=voice`)} className="p-4 bg-purple-500/10 rounded-2xl hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 shadow-lg"><HiOutlinePhone size={26} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.sub;
                const isImage = m.text.startsWith("http");
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[65%] px-8 py-4 shadow-2xl transition-all ${isMe 
                      ? 'bg-gradient-to-br from-cyan-600/80 to-blue-700/80 text-white rounded-l-[2rem] rounded-tr-[2rem] skew-x-[-6deg] border border-cyan-400/30' 
                      : 'bg-white/5 border border-white/10 text-cyan-100 rounded-r-[2rem] rounded-tl-[2rem] skew-x-[6deg]'}`}>
                      {isImage ? (
                        <img src={m.text} className={`max-w-full rounded-xl max-h-72 object-cover ${isMe ? 'skew-x-[6deg]' : 'skew-x-[-6deg]'}`} alt="sent" />
                      ) : (
                        <p className={`${isMe ? 'skew-x-[6deg]' : 'skew-x-[-6deg]'} text-[15px] font-medium leading-relaxed`}>{m.text}</p>
                      )}
                      <div className={`flex items-center gap-2 mt-2 opacity-40 font-mono italic text-[9px] ${isMe ? 'justify-end skew-x-[6deg]' : 'justify-start skew-x-[-6deg]'}`}>
                        <span>{isMe ? 'SENT' : 'RECEIVED'}</span>
                        <HiCheck size={12} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-10">
              <div className="flex items-center gap-5 bg-white/5 p-3 rounded-[2.5rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <label className="cursor-pointer p-3 text-gray-500 hover:text-cyan-400">
                  <HiOutlinePaperClip size={28} />
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                </label>
                <input 
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(newMessage)}
                  placeholder={isUploading ? "UPLOADING..." : "ENCRYPTED FREQUENCY ACTIVE..."}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-cyan-100 uppercase tracking-[0.3em] placeholder:text-cyan-900"
                />
                <button onClick={() => handleSend(newMessage)} className="bg-cyan-500 p-5 rounded-[1.8rem] text-black shadow-[0_0_20px_cyan] hover:scale-105 active:scale-95 transition-all">
                  <HiOutlinePaperAirplane size={24} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center group">
            <div className="w-40 h-40 bg-cyan-500/5 rounded-full border border-cyan-500/10 flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:shadow-cyan-500/10 transition-all duration-700">
              <HiOutlineChatBubbleBottomCenterText size={70} className="text-cyan-500 opacity-20 group-hover:opacity-40 transition-all" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-[1em] text-cyan-500/30 group-hover:text-cyan-500 transition-all">Neural Link Idle</h2>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className={`p-10 rounded-[3rem] ${glassPanel} text-center max-w-sm w-full border-cyan-500`}>
              <div className="w-24 h-24 rounded-full bg-cyan-500/20 mx-auto mb-6 flex items-center justify-center animate-bounce border border-cyan-500">
                <HiOutlinePhone size={40} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Incoming Link</h2>
              <p className="text-cyan-400 font-mono mb-8 tracking-widest uppercase">{incomingCall.fromName}</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => { stopRingtone(); navigate(`/call/${incomingCall.roomId}?type=${incomingCall.type}`); setIncomingCall(null); }} className="bg-cyan-500 text-black px-8 py-3 rounded-2xl font-bold uppercase shadow-[0_0_15px_cyan]">Accept</button>
                <button onClick={() => { stopRingtone(); setIncomingCall(null); }} className="bg-red-500/20 text-red-500 border border-red-500/40 px-8 py-3 rounded-2xl font-bold uppercase">Decline</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;