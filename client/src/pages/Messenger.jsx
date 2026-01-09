import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineFaceSmile, HiOutlineUser, HiCheck, HiOutlineMagnifyingGlass,
  HiOutlineCamera, HiOutlineChatBubbleBottomCenterText, HiOutlineMicrophone,
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
  
  const socket = useRef();
  const scrollRef = useRef();
  const ringtoneRef = useRef();
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // Glassmorphism Styles
  const glassPanel = "bg-[#030712]/60 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]";
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

  // Fetch Data
  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
      setConversations(res.data || []);
    };
    if (user?.sub) fetch();
  }, [user]);

  useEffect(() => {
    if (currentChat) {
      const fetchMsgs = async () => {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat._id}`);
        setMessages(res.data);
      };
      fetchMsgs();
    }
  }, [currentChat]);

  // Handle Send
  const handleSend = async (text, fileUrl = null) => {
    if (!text.trim() && !fileUrl) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const messageBody = { conversationId: currentChat._id, senderId: user.sub, text: fileUrl || text };
    socket.current.emit("sendMessage", { senderId: user.sub, receiverId, text: fileUrl || text });
    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageBody);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      handleSend("", res.data.url);
    } catch (err) { alert("Upload failed"); }
    finally { setIsUploading(false); }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const stopRingtone = () => {
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
  };

  return (
    <div className="flex h-screen bg-[#010409] text-white p-2 md:p-6 gap-2 md:gap-6 font-sans overflow-hidden fixed inset-0">
      
      {/* ১. লেফট নেভিগেশন (ডেস্কটপে দেখাবে, মোবাইলে হাইড) */}
      <div className={`hidden md:flex w-20 ${glassPanel} rounded-[2rem] flex-col items-center py-10 gap-12`}>
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_20px_cyan] border border-cyan-500/30">
          <HiOutlineMicrophone size={24} className="text-cyan-400" />
        </div>
        <HiOutlineChatBubbleBottomCenterText size={28} className="text-cyan-400" />
        <HiOutlineUser size={28} className="text-gray-500 hover:text-cyan-400 cursor-pointer transition-all" />
        <div className="mt-auto">
          <img src={user?.picture} className="w-12 h-12 rounded-2xl border-2 border-cyan-500/50" alt="" />
        </div>
      </div>

      {/* ২. চ্যাট লিস্ট (মোবাইলে যখন চ্যাট সিলেক্ট করা নেই তখন ফুল স্ক্রিন দেখাবে) */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] ${glassPanel} rounded-[2rem] md:rounded-[3rem] flex flex-col overflow-hidden`}>
        <div className="p-6 md:p-8">
          <h2 className={`text-xl md:text-2xl uppercase italic tracking-tighter ${neonText}`}>Neonus Channels</h2>
          <div className="mt-4 md:mt-6 bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center">
            <HiOutlineMagnifyingGlass className="text-gray-500 mr-2" />
            <input placeholder="SEARCH FREQUENCY..." className="bg-transparent border-none outline-none text-[10px] w-full tracking-[0.2em] text-cyan-200" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {conversations.map((c) => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className={`p-4 md:p-5 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/20 border border-cyan-500/30 shadow-lg' : 'hover:bg-white/5'}`}>
              <div className="relative flex-shrink-0">
                <img src={`https://ui-avatars.com/api/?name=${c._id}&background=random`} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl rotate-2" alt="" />
                {onlineUsers.some(u => c.members.includes(u.userId) && u.userId !== user.sub) && 
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#010409]"></div>
                }
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm truncate uppercase italic tracking-wider">Channel_{c._id.slice(-4)}</h4>
                <p className="text-[9px] text-cyan-400/60 font-mono tracking-widest uppercase">Encrypted</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ৩. মেইন চ্যাট এরিয়া (মোবাইলে চ্যাট সিলেক্ট করলে এটি ফুল স্ক্রিন হবে) */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 ${glassPanel} rounded-[2rem] md:rounded-[3.5rem] flex flex-col relative`}>
        {currentChat ? (
          <>
            <header className="px-4 py-4 md:px-10 md:py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3 md:gap-5">
                <button onClick={() => setCurrentChat(null)} className="md:hidden p-2 text-cyan-400"><HiOutlineChevronLeft size={24} /></button>
                <img src={`https://ui-avatars.com/api/?name=${currentChat._id}`} className="w-10 h-10 md:w-14 md:h-14 rounded-xl border border-cyan-500/20 shadow-xl" />
                <div>
                  <h3 className="text-xs md:text-xl font-black italic uppercase tracking-widest">Node_{currentChat._id.slice(-4)}</h3>
                  <p className="text-[8px] md:text-[10px] text-cyan-400 animate-pulse font-mono tracking-[0.3em]">LINK_STABLE</p>
                </div>
              </div>
              <div className="flex gap-2 md:gap-4">
                <button onClick={() => navigate(`/call/${currentChat._id}?type=video`)} className="p-2 md:p-4 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/10 shadow-lg"><HiOutlineVideoCamera size={22} /></button>
                <button onClick={() => navigate(`/call/${currentChat._id}?type=voice`)} className="p-2 md:p-4 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/10 shadow-lg"><HiOutlinePhone size={22} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.sub;
                const isImage = m.text.startsWith("http");
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[85%] md:max-w-[65%] px-5 py-3 md:px-8 md:py-4 shadow-xl transition-all ${isMe 
                      ? 'bg-gradient-to-br from-cyan-600/70 to-blue-700/70 text-white rounded-l-[1.5rem] rounded-tr-[1.5rem] skew-x-[-4deg] border border-cyan-400/30' 
                      : 'bg-white/5 border border-white/10 text-cyan-100 rounded-r-[1.5rem] rounded-tl-[1.5rem] skew-x-[4deg]'}`}>
                      {isImage ? (
                        <img src={m.text} className={`max-w-full rounded-xl max-h-60 md:max-h-72 object-cover ${isMe ? 'skew-x-[4deg]' : 'skew-x-[-4deg]'}`} alt="sent" />
                      ) : (
                        <p className={`${isMe ? 'skew-x-[4deg]' : 'skew-x-[-4deg]'} text-xs md:text-[15px] font-medium`}>{m.text}</p>
                      )}
                      <div className={`flex items-center gap-2 mt-2 opacity-40 font-mono italic text-[8px] md:text-[9px] ${isMe ? 'justify-end skew-x-[4deg]' : 'justify-start skew-x-[-4deg]'}`}>
                        <HiCheck size={12} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 md:p-10">
              <div className="flex items-center gap-3 md:gap-5 bg-white/5 p-2 md:p-3 rounded-[1.5rem] md:rounded-[2.5rem] border border-cyan-500/20 shadow-2xl">
                <label className="cursor-pointer p-2 md:p-3 text-gray-500 hover:text-cyan-400">
                  <HiOutlinePaperClip size={24} />
                  <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                </label>
                <input 
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(newMessage)}
                  placeholder={isUploading ? "UPLOADING..." : "TYPE FREQUENCY..."}
                  className="flex-1 bg-transparent border-none outline-none text-[10px] md:text-xs text-cyan-100 uppercase tracking-widest placeholder:text-cyan-900"
                />
                <button onClick={() => handleSend(newMessage)} className="bg-cyan-500 p-3 md:p-5 rounded-full md:rounded-[2rem] text-black shadow-[0_0_15px_cyan] transition-all">
                  <HiOutlinePaperAirplane size={20} className="rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center opacity-20 group">
             <HiOutlineChatBubbleBottomCenterText size={80} className="text-cyan-500" />
             <h2 className="text-xl font-black uppercase tracking-[0.5em] mt-4">Neural Link Idle</h2>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className={`p-8 md:p-10 rounded-[2.5rem] ${glassPanel} text-center max-w-sm w-full border-cyan-500`}>
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 mx-auto mb-6 flex items-center justify-center animate-bounce border border-cyan-500"><HiOutlinePhone size={32} className="text-cyan-400" /></div>
              <h2 className="text-xl font-black uppercase mb-2 italic">Incoming Link</h2>
              <p className="text-cyan-400 font-mono mb-8 tracking-widest uppercase truncate">{incomingCall.fromName}</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => { stopRingtone(); navigate(`/call/${incomingCall.roomId}?type=${incomingCall.type}`); setIncomingCall(null); }} className="bg-cyan-500 text-black px-6 py-3 rounded-xl font-bold uppercase shadow-[0_0_10px_cyan]">Accept</button>
                <button onClick={() => { stopRingtone(); setIncomingCall(null); }} className="bg-red-500/20 text-red-500 border border-red-500/40 px-6 py-3 rounded-xl font-bold uppercase">Decline</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;