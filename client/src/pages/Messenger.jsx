import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera, 
  HiOutlinePaperAirplane, HiOutlineMagnifyingGlass, 
  HiOutlineFaceSmile, HiOutlineUserGroup
} from "react-icons/hi2";
import { useNavigate, useLocation } from "react-router-dom";

const Messenger = () => {
  const { user } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = "https://onyx-drift-app-final.onrender.com";
  const glassPanel = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden";

  // --- ১. সকেট কানেকশন এবং হ্যান্ডলিং ---
  useEffect(() => {
    socket.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.current.on("getMessage", (data) => {
      setArrivalMessage({ 
        senderId: data.senderId, 
        text: data.text, 
        createdAt: Date.now() 
      });
    });

    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [API_URL]);

  useEffect(() => {
    if (user?.sub && socket.current) {
      socket.current.emit("addNewUser", user.sub);
    }
  }, [user]);

  // নতুন মেসেজ আসলে তা চ্যাটে যোগ করা
  useEffect(() => {
    if (arrivalMessage && currentChat?.members?.includes(arrivalMessage.senderId)) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  // --- ২. কনভারসেশন লোড করা ---
  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data || []);
      } catch (err) { console.error("Conversation Fetch Error:", err); }
    };
    if (user?.sub) getConversations();
  }, [user?.sub, API_URL]);

  // নির্দিষ্ট চ্যাটের মেসেজ লোড করা
  useEffect(() => {
    const getMessages = async () => {
      if (!currentChat || currentChat?.isTest) return; 
      try {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat?._id}`);
        setMessages(res.data || []);
      } catch (err) { console.error("Message Fetch Error:", err); }
    };
    getMessages();
  }, [currentChat, API_URL]);

  // --- ৩. মেসেজ পাঠানো ---
  const handleSubmit = async () => {
    if (!newMessage.trim() || !currentChat) return;
    
    const receiverId = currentChat.members?.find((member) => member !== user.sub);
    const messageObj = { 
      senderId: user.sub, 
      text: newMessage, 
      conversationId: currentChat._id 
    };
    
    // সকেটের মাধ্যমে রিয়েল টাইম পাঠানো
    socket.current.emit("sendMessage", { 
      senderId: user.sub, 
      receiverId, 
      text: newMessage 
    });

    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageObj);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error("Send Error:", err); }
  };

  // কল হ্যান্ডলার
  const handleCall = (type) => {
    if (!currentChat) return;
    const remoteId = currentChat.members?.find(m => m !== user.sub);
    // কল পেজে নিয়ে যাবে (userId এবং টাইপ সহ)
    navigate(`/call/${remoteId}?type=${type}`);
  };

  const isOnline = (members) => {
    const otherMemberId = members?.find(m => m !== user?.sub);
    return onlineUsers.some((u) => u.userId === otherMemberId);
  };

  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-transparent text-white overflow-hidden font-sans gap-4 p-2">
      
      {/* বাম পাশের লিস্ট (Sidebar) */}
      <div className={`w-full md:w-[380px] ${glassPanel} rounded-[2.5rem] flex flex-col ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white/90">Nexus Chat</h2>
            <HiOutlineUserGroup size={22} className="text-cyan-400" />
          </div>
          
          <div className="relative flex items-center bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
            <HiOutlineMagnifyingGlass className="text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search frequency..." 
              className="bg-transparent border-none outline-none text-xs ml-3 w-full text-white"
              value={searchTerm}
              onChange={(e)=>setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-2 pb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-4">Active Channels</p>
            {conversations.map((c) => (
              <motion.div 
                key={c._id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentChat(c)}
                className={`p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/10 border border-cyan-500/20 shadow-lg' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                    <img src={`https://ui-avatars.com/api/?name=User&background=random`} className="w-11 h-11 rounded-2xl object-cover" alt="" />
                    {isOnline(c.members) && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 border-2 border-[#020617] rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate uppercase italic text-white/90">Channel {c._id.slice(-4)}</h4>
                  <p className="text-[10px] truncate text-gray-500">
                    {isOnline(c.members) ? "Active Signal" : "Offline"}
                  </p>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* ডান পাশের চ্যাট উইন্ডো (Chat Window) */}
      <div className={`flex-1 ${glassPanel} rounded-[2.5rem] flex flex-col relative ${!currentChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {currentChat ? (
          <>
            {/* চ্যাট হেডার */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-gray-400" onClick={() => setCurrentChat(null)}><HiOutlineChevronLeft size={24} /></button>
                <img src={`https://ui-avatars.com/api/?name=User&background=random`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase italic text-white/90">
                    Channel {currentChat._id.slice(-4)}
                  </h3>
                  <p className="text-[9px] text-cyan-400 font-black uppercase tracking-widest animate-pulse">
                    {isOnline(currentChat.members) ? "Secure Link Active" : "Waiting for peer..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCall('voice')} className="p-3 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all"><HiOutlinePhone size={20} /></button>
                <button onClick={() => handleCall('video')} className="p-3 text-gray-400 hover:text-purple-400 hover:bg-white/5 rounded-xl transition-all"><HiOutlineVideoCamera size={20} /></button>
              </div>
            </div>

            {/* মেসেজ লিস্ট */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {messages.map((m, index) => {
                const isMe = m.senderId === user?.sub;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[75%] px-5 py-3 rounded-3xl text-[13px] font-light shadow-xl ${isMe ? 'bg-gradient-to-tr from-cyan-600 to-purple-600 text-white rounded-br-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none'}`}
                    >
                      {m.text}
                    </motion.div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* ইনপুট এরিয়া */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-3xl border border-white/10 max-w-4xl mx-auto">
                <button className="p-2 text-gray-500 hover:text-cyan-400"><HiOutlineFaceSmile size={22} /></button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Transmit message..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white px-2"
                />
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSubmit}
                  className={`p-3 rounded-2xl transition-all ${newMessage.trim() ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/40" : "bg-white/10 text-gray-600"}`}
                >
                  <HiOutlinePaperAirplane size={16} />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-30 p-12 text-center">
             <div className="w-24 h-24 bg-cyan-500/5 rounded-[3rem] flex items-center justify-center mb-6 border border-cyan-500/10">
                <HiOutlinePaperAirplane size={40} className="text-cyan-400 -rotate-45" />
             </div>
             <h3 className="text-sm font-black uppercase tracking-[0.5em] text-white">Select Frequency</h3>
             <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">End-to-End Encryption Active</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;