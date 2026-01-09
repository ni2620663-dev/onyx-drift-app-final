import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineFaceSmile, HiOutlineUser, HiOutlinePowerDel,
  HiOutlineCamera, HiOutlineChatBubbleBottomCenterText, HiOutlineMicrophone
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const Messenger = () => {
  const { user } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // Glassmorphism Styles
  const glassBg = "bg-opacity-10 bg-clip-padding backdrop-filter backdrop-blur-xl bg-white border border-white/10";
  const neonGlow = "shadow-[0_0_15px_rgba(34,211,238,0.2)]";

  useEffect(() => {
    socket.current = io(API_URL, { transports: ["websocket"] });
    socket.current.on("getMessage", (data) => {
      if (currentChat?.members.includes(data.senderId)) {
        setMessages((prev) => [...prev, { ...data, createdAt: Date.now() }]);
      }
    });
    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));
    return () => socket.current.disconnect();
  }, [currentChat]);

  useEffect(() => {
    if (user?.sub) socket.current.emit("addNewUser", user.sub);
  }, [user]);

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

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    socket.current.emit("sendMessage", { senderId: user.sub, receiverId, text: newMessage });
    const res = await axios.post(`${API_URL}/api/messages/message`, {
      conversationId: currentChat._id, senderId: user.sub, text: newMessage
    });
    setMessages([...messages, res.data]);
    setNewMessage("");
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex h-screen bg-[#020617] text-cyan-50 p-4 gap-4 font-sans overflow-hidden">
      
      {/* ১. লেফট সাইড নেভিগেশন (আইকন বার) */}
      <div className={`w-16 ${glassBg} rounded-3xl flex flex-col items-center py-8 gap-10 border-cyan-500/20`}>
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse shadow-[0_0_15px_cyan]">
          <HiOutlineMicrophone size={20} className="text-cyan-400" />
        </div>
        <HiOutlineChatBubbleBottomCenterText size={24} className="text-gray-500 hover:text-cyan-400 cursor-pointer transition-all" />
        <HiOutlineUser size={24} className="text-gray-500 hover:text-cyan-400 cursor-pointer transition-all" />
        <div className="mt-auto">
          <img src={user?.picture} className="w-10 h-10 rounded-2xl border border-cyan-500/50" alt="" />
        </div>
      </div>

      {/* ২. চ্যাট লিস্ট (Channels) */}
      <div className={`w-full md:w-[350px] ${glassBg} rounded-[2.5rem] flex flex-col overflow-hidden border-cyan-500/10 ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-cyan-400">Neonus Channels</h2>
          <div className="mt-4 bg-white/5 p-2 rounded-2xl border border-white/5 flex items-center">
            <input placeholder="Search Frequency..." className="bg-transparent border-none outline-none text-xs w-full px-2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar">
          {conversations.map((c) => (
            <motion.div 
              key={c._id} whileHover={{ x: 5 }} onClick={() => setCurrentChat(c)}
              className={`p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/20 border border-cyan-500/30 shadow-lg' : 'hover:bg-white/5'}`}
            >
              <div className="relative">
                <img src={`https://ui-avatars.com/api/?name=${c._id}&background=random`} className="w-12 h-12 rounded-2xl rotate-3" alt="" />
                {onlineUsers.some(u => c.members.includes(u.userId) && u.userId !== user.sub) && 
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
                }
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase italic">Channel_{c._id.slice(-4)}</h4>
                <p className="text-[10px] text-cyan-400/60 font-mono tracking-widest">ENCRYPTED</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ৩. মেইন ইন্টারফেস (Message Area) */}
      <div className={`flex-1 ${glassBg} rounded-[3rem] flex flex-col relative border-cyan-500/10 ${!currentChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {currentChat ? (
          <>
            <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src={`https://ui-avatars.com/api/?name=${currentChat._id}`} className="w-12 h-12 rounded-2xl border border-cyan-500/30" />
                <div>
                  <h3 className="text-lg font-black italic uppercase tracking-widest text-white">Aura_Node_{currentChat._id.slice(-4)}</h3>
                  <span className="text-[10px] text-cyan-400 animate-pulse font-mono tracking-[0.3em]">LINK_STABLE</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => navigate(`/call/${currentChat._id}?type=video`)} className="p-3 bg-cyan-500/10 rounded-2xl hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20"><HiOutlineVideoCamera size={22} /></button>
                <button onClick={() => navigate(`/call/${currentChat._id}?type=voice`)} className="p-3 bg-purple-500/10 rounded-2xl hover:bg-purple-500/30 text-purple-400 border border-purple-500/20"><HiOutlinePhone size={22} /></button>
              </div>
            </header>

            {/* চ্যাট এরিয়া (Cyberpunk Bubbles) */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.sub;
                return (
                  <motion.div initial={{ opacity: 0, x: isMe ? 50 : -50 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[70%] px-6 py-3 shadow-2xl transition-all ${isMe 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-l-2xl rounded-tr-2xl skew-x-[-10deg]' 
                      : 'bg-white/5 border border-white/10 text-cyan-100 rounded-r-2xl rounded-tl-2xl skew-x-[10deg]'}`}>
                      <p className={`${isMe ? 'skew-x-[10deg]' : 'skew-x-[-10deg]'} text-sm font-medium tracking-wide`}>{m.text}</p>
                      <span className="text-[9px] opacity-40 mt-2 block text-right font-mono italic">RECEIVED</span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* ইনপুট বক্স (Neural Style) */}
            <div className="p-8 bg-black/20">
              <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                <button className="p-3 text-gray-500 hover:text-cyan-400 transition-colors"><HiOutlineFaceSmile size={24} /></button>
                <input 
                  value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="ENCRYPTED FREQUENCY ACTIVE..." 
                  className="flex-1 bg-transparent border-none outline-none text-xs text-cyan-100 uppercase tracking-widest"
                />
                <button className="p-3 text-gray-500 hover:text-cyan-400 transition-colors"><HiOutlineCamera size={24} /></button>
                <button onClick={handleSend} className="bg-cyan-500 p-4 rounded-2xl text-black shadow-lg shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all">
                  <HiOutlinePaperAirplane size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-32 h-32 bg-cyan-500/5 rounded-full border border-cyan-500/10 flex items-center justify-center mx-auto mb-6">
              <HiOutlineChatBubbleBottomCenterText size={50} className="text-cyan-500 opacity-30" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.8em] text-cyan-500/50">Neural Link Idle</h2>
            <p className="text-[10px] text-gray-600 mt-2 tracking-widest uppercase">Select Frequency To Start Transmission</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;