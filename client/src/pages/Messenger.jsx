import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera, 
  HiOutlinePaperAirplane, HiOutlineMagnifyingGlass, 
  HiOutlineFaceSmile, HiOutlineUserGroup, HiOutlineXMark, HiOutlineCheck
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
  
  // --- কলিং স্টেট ---
  const [incomingCall, setIncomingCall] = useState(null); 
  const ringtoneRef = useRef(null);

  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = "https://onyx-drift-app-final.onrender.com";
  const glassPanel = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden";

  // ১. সকেট কানেকশন ও ইভেন্ট হ্যান্ডলিং
  useEffect(() => {
    socket.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    // মেসেজ রিসিভ করা
    socket.current.on("getMessage", (data) => {
      setArrivalMessage({ 
        senderId: data.senderId, 
        text: data.text, 
        createdAt: Date.now() 
      });
    });

    // অনলাইন ইউজার আপডেট
    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));

    // --- ইনকামিং কল লিসেনার ---
    socket.current.on("incomingCall", (data) => {
      setIncomingCall(data);
      ringtoneRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3");
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("Audio play failed", e));
    });

    // কল কেটে দিলে বা রিজেক্ট করলে লিসেনার
    socket.current.on("callRejected", () => {
      stopRingtone();
      setIncomingCall(null);
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [API_URL]);

  useEffect(() => {
    if (user?.sub && socket.current) {
      socket.current.emit("addNewUser", user.sub);
    }
  }, [user]);

  useEffect(() => {
    if (arrivalMessage && currentChat?.members?.includes(arrivalMessage.senderId)) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  // ২. এপিআই ডেটা ফেচিং
  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data || []);
      } catch (err) { console.error("Conversation Fetch Error:", err); }
    };
    if (user?.sub) getConversations();
  }, [user?.sub, API_URL]);

  useEffect(() => {
    const getMessages = async () => {
      if (!currentChat) return; 
      try {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat?._id}`);
        setMessages(res.data || []);
      } catch (err) { console.error("Message Fetch Error:", err); }
    };
    getMessages();
  }, [currentChat, API_URL]);

  // ৩. মেসেজ এবং কল ফাংশনালিটি
  const handleSubmit = async () => {
    if (!newMessage.trim() || !currentChat) return;
    const receiverId = currentChat.members?.find((member) => member !== user.sub);
    const messageObj = { senderId: user.sub, text: newMessage, conversationId: currentChat._id };
    
    socket.current.emit("sendMessage", { senderId: user.sub, receiverId, text: newMessage });

    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageObj);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error("Send Error:", err); }
  };

  // রিংটোন বন্ধ করার হেল্পার
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // কল পাঠানো
  const handleCall = (type) => {
    if (!currentChat) return;
    const remoteId = currentChat.members?.find(m => m !== user.sub);
    const roomId = currentChat._id;

    socket.current.emit("callUser", {
      userToCall: remoteId,
      fromName: user.name || "Anonymous",
      roomId: roomId,
      type: type
    });

    navigate(`/call/${roomId}?type=${type}`);
  };

  // কল রিসিভ করা (Accept)
  const acceptCall = () => {
    stopRingtone();
    const targetRoom = incomingCall.roomId;
    const type = incomingCall.type;
    setIncomingCall(null);
    navigate(`/call/${targetRoom}?type=${type}`);
  };

  // কল কেটে দেওয়া (Reject/Cut)
  const rejectCall = () => {
    stopRingtone();
    if (incomingCall) {
        // অপর পক্ষকে জানানো যে কল কেটে দেওয়া হয়েছে
        const remoteId = incomingCall.from; // নিশ্চিত করুন ব্যাকএন্ড থেকে 'from' আইডিটি আসছে
        socket.current.emit("rejectCall", { targetId: remoteId });
    }
    setIncomingCall(null);
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
      
      {/* --- ইনকামিং কল মডাল --- */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000] w-[320px] bg-[#0f172a]/95 backdrop-blur-3xl border border-cyan-500/40 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col items-center gap-4"
          >
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    {incomingCall.type === 'video' ? 
                        <HiOutlineVideoCamera size={40} className="text-cyan-400" /> : 
                        <HiOutlinePhone size={40} className="text-cyan-400" />
                    }
                </div>
            </div>

            <div className="text-center">
              <h3 className="font-black text-xl uppercase tracking-tighter italic text-white">{incomingCall.fromName}</h3>
              <p className="text-[10px] text-cyan-400 uppercase font-black tracking-[0.2em] animate-pulse">Incoming {incomingCall.type} call...</p>
            </div>

            <div className="flex gap-4 w-full mt-2">
              <button 
                onClick={rejectCall} 
                className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-4 rounded-2xl transition-all flex justify-center border border-red-500/20 group"
              >
                <HiOutlineXMark size={28} className="group-hover:scale-125 transition-transform" />
              </button>
              <button 
                onClick={acceptCall} 
                className="flex-1 bg-cyan-500 text-black p-4 rounded-2xl transition-all flex justify-center shadow-lg shadow-cyan-500/40 hover:scale-105"
              >
                <HiOutlineCheck size={28} className="animate-bounce" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- লেফট সাইডবার --- */}
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
              className="bg-transparent border-none outline-none text-xs ml-3 w-full text-white placeholder:text-gray-600"
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
                    {isOnline(c.members) && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 border-2 border-[#020617] rounded-full animate-pulse"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate uppercase italic text-white/90">Channel {c._id.slice(-4)}</h4>
                  <p className="text-[10px] truncate text-gray-500">{isOnline(c.members) ? "● Connected" : "● Offline"}</p>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* --- চ্যাট উইন্ডো --- */}
      <div className={`flex-1 ${glassPanel} rounded-[2.5rem] flex flex-col relative ${!currentChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {currentChat ? (
          <>
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-gray-400" onClick={() => setCurrentChat(null)}><HiOutlineChevronLeft size={24} /></button>
                <img src={`https://ui-avatars.com/api/?name=User&background=random`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase italic text-white/90">Channel {currentChat._id.slice(-4)}</h3>
                  <p className="text-[9px] text-cyan-400 font-black uppercase tracking-widest animate-pulse">Secure Link Active</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCall('voice')} className="p-3 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-all shadow-inner"><HiOutlinePhone size={20} /></button>
                <button onClick={() => handleCall('video')} className="p-3 text-gray-400 hover:text-purple-400 hover:bg-white/5 rounded-xl transition-all shadow-inner"><HiOutlineVideoCamera size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {messages.map((m, index) => {
                const isMe = m.senderId === user?.sub;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <motion.div initial={{ opacity: 0, scale: 0.9, x: isMe ? 20 : -20 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                      className={`max-w-[75%] px-5 py-3 rounded-3xl text-[13px] font-light shadow-xl ${isMe ? 'bg-gradient-to-tr from-cyan-600 to-purple-600 text-white rounded-br-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-none'}`}
                    >
                      {m.text}
                    </motion.div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-3xl border border-white/10 max-w-4xl mx-auto">
                <button className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><HiOutlineFaceSmile size={22} /></button>
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