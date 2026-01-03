import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera, 
  HiOutlineInformationCircle, HiOutlinePaperAirplane, HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass, HiOutlineFaceSmile, HiOutlinePhoto, HiOutlineUserGroup
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const Messenger = () => {
  const { user } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- টেস্ট করার জন্য ডামি পিপল লিস্ট ---
  const staticPeople = [
    { _id: "test_user_1", name: "Alpha Drifter", img: "https://i.pravatar.cc/150?u=alpha", status: "Online" },
    { _id: "test_user_2", name: "Cyber Onyx", img: "https://i.pravatar.cc/150?u=onyx", status: "Away" },
    { _id: "test_user_3", name: "Neural Queen", img: "https://i.pravatar.cc/150?u=queen", status: "Online" },
  ];

  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();

  // URL এবং টাইমআউট আপডেট করা হয়েছে স্ট্যাবিলিটির জন্য
  const API_URL = "https://onyx-drift-app-final.onrender.com";
  const glassPanel = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden";

  // চ্যাট শুরু করার ফাংশন
  const startChat = (person) => {
    setCurrentChat({
      _id: person._id,
      members: [user?.sub, person._id],
      isTest: true,
      name: person.name,
      img: person.img
    });
    setMessages([
      { senderId: person._id, text: `Hello! This is ${person.name}. Signal is clear.`, createdAt: Date.now() }
    ]);
  };

  // ১. সকেট কানেকশন লজিক (আপডেটেড)
  useEffect(() => {
    socket.current = io(API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 10,
      timeout: 60000, // Render সার্ভারের জন্য ১ মিনিট টাইমআউট
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

  // ২. ইনকামিং মেসেজ হ্যান্ডেল করা
  useEffect(() => {
    if (arrivalMessage && currentChat?.members.includes(arrivalMessage.senderId)) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  // ৩. অনলাইন স্ট্যাটাস আপডেট
  useEffect(() => {
    if (user?.sub && socket.current) {
      socket.current.emit("addNewUser", user.sub);
    }
  }, [user]);

  // ৪. কনভারসেশন লিস্ট আনা
  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data);
      } catch (err) { console.error("Conversation Fetch Error:", err); }
    };
    if (user?.sub) getConversations();
  }, [user?.sub, API_URL]);

  // ৫. মেসেজ হিস্ট্রি আনা
  useEffect(() => {
    const getMessages = async () => {
      if (!currentChat || currentChat?.isTest) return; 
      try {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat?._id}`);
        setMessages(res.data);
      } catch (err) { console.error("Message Fetch Error:", err); }
    };
    getMessages();
  }, [currentChat, API_URL]);

  // ৬. মেসেজ পাঠানোর ফাংশন (রিয়েল-টাইম + এপিআই)
  const handleSubmit = async () => {
    if (!newMessage.trim() || !currentChat) return;
    
    const receiverId = currentChat.members.find((member) => member !== user.sub);
    const messageObj = { 
      senderId: user.sub, 
      text: newMessage, 
      conversationId: currentChat._id 
    };
    
    // সকেটে পাঠানো
    socket.current.emit("sendMessage", { 
      senderId: user.sub, 
      receiverId, 
      text: newMessage 
    });

    // টেস্ট চ্যাট হলে শুধু লোকাল স্টেটে আপডেট
    if (currentChat.isTest) {
        setMessages((prev) => [...prev, { ...messageObj, createdAt: Date.now() }]);
        setNewMessage("");
        return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageObj);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error("Send Error:", err); }
  };

  // অনলাইন চেক ফাংশন
  const isOnline = (members) => {
    const otherMemberId = members.find(m => m !== user?.sub);
    return onlineUsers.some((u) => u.userId === otherMemberId);
  };

  // স্ক্রল অটোমেশন
  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-transparent text-white overflow-hidden font-sans gap-4 p-2">
      
      {/* ১. লেফট সাইডবার */}
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
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-6 pb-6">
          {/* Active Conversations */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-4">Active Channels</p>
            {conversations.map((c) => (
              <motion.div 
                key={c._id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentChat(c)}
                className={`p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all mb-2 ${currentChat?._id === c._id ? 'bg-cyan-500/10 border border-cyan-500/20 shadow-lg' : 'hover:bg-white/5'}`}
              >
                <img src={`https://i.pravatar.cc/150?u=${c._id}`} className="w-11 h-11 rounded-2xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate uppercase italic text-white/90">User {c._id.slice(-4)}</h4>
                  <p className="text-[10px] truncate text-gray-500">
                    {isOnline(c.members) ? "● Online" : "Connected..."}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Test People Section */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 ml-4">Neural Contacts (Test)</p>
            {staticPeople.map((person) => (
              <motion.div 
                key={person._id}
                whileTap={{ scale: 0.97 }}
                onClick={() => startChat(person)}
                className={`p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all mb-2 border border-transparent ${currentChat?._id === person._id ? 'bg-purple-500/10 border-purple-500/20' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                  <img src={person.img} className="w-11 h-11 rounded-2xl object-cover border border-white/10" alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-4 border-[#020617] rounded-full ${person.status === 'Online' ? 'bg-cyan-400' : 'bg-gray-600'}`}></div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-white/90 uppercase italic">{person.name}</h4>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">{person.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ২. রাইট সাইড: চ্যাট উইন্ডো */}
      <div className={`flex-1 ${glassPanel} rounded-[2.5rem] flex flex-col relative ${!currentChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {currentChat ? (
          <>
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-gray-400" onClick={() => setCurrentChat(null)}><HiOutlineChevronLeft size={24} /></button>
                <img src={currentChat.img || `https://i.pravatar.cc/150?u=${currentChat._id}`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase italic text-white/90">
                    {currentChat.name || `Channel ${currentChat._id.slice(-4)}`}
                  </h3>
                  <p className="text-[9px] text-cyan-400 font-black uppercase tracking-widest animate-pulse">Encrypted Connection</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => alert("Starting Voice Call...")} className="p-3 text-gray-500 hover:text-cyan-400 transition-colors"><HiOutlinePhone size={20} /></button>
                <button onClick={() => navigate(`/call/${currentChat._id}`)} className="p-3 text-gray-500 hover:text-purple-400 transition-colors"><HiOutlineVideoCamera size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {messages.map((m, index) => {
                const isMe = m.senderId === user.sub;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
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