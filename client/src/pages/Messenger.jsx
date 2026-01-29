import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { 
  HiChatBubbleLeftRight, HiUsers, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiBolt, HiOutlinePhoto,
  HiOutlineClock, HiCheckBadge, HiOutlineLockClosed,
  HiOutlineEyeSlash, HiOutlineMicrophone
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

// 🧠 Phase-7: Display Name & Avatar Resolver (The Ultimate Fix)
const getDisplayName = (u) => {
  if (!u) return "Drifter";
  // API থেকে আসা ভিন্ন ভিন্ন প্রপার্টি চেক করা
  const name = u.name || u.nickname || u.displayName || u.username;
  if (name && name.trim() !== "") return name;
  
  // যদি নাম না থাকে তবে ইমেইল বা আইডি স্লাইস ব্যবহার করা
  const fallback = u.email ? u.email.split('@')[0] : (u.userId?.slice(-6) || u.sub?.slice(-6) || "Drifter");
  return `@${fallback}`;
};

const getAvatar = (u) => {
  if (u?.picture || u?.avatar || u?.image) return u.picture || u.avatar || u.image;
  // ছবি না থাকলে ডাইনামিক এভাতার
  const name = getDisplayName(u);
  return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(name)}`;
};

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [isIncognito, setIsIncognito] = useState(false);
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  
  const scrollRef = useRef();
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  // --- 📡 Data Fetching ---
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Conv Error:", err); }
  }, [getAccessTokenSilently, API_URL]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) { 
      console.error("Fetch Msgs Error (404/500):", err);
      setMessages([]); // এরর হলে লিস্ট খালি করে দেয়া যাতে পুরনো ডাটা না থাকে
    }
  }, [getAccessTokenSilently, API_URL]);

  useEffect(() => {
    if (currentChat?._id) fetchMessages(currentChat._id);
  }, [currentChat, fetchMessages]);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  // --- ⚡ Socket Setup ---
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;
    s.emit("addNewUser", user.sub);
    s.on("getMessage", (data) => {
      if (currentChat?._id === data.conversationId) setMessages(prev => [...prev, data]);
      fetchConversations();
    });
    return () => s.off("getMessage");
  }, [socket, currentChat, user, fetchConversations]);

  // --- 🖊 Sending Message ---
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    const msgData = {
      senderId: user.sub,
      senderName: getDisplayName(user),
      text: newMessage,
      conversationId: currentChat._id,
      isSelfDestruct: isSelfDestruct
    };

    setMessages(prev => [...prev, { ...msgData, _id: Date.now() }]);
    setNewMessage("");

    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const s = socket?.current || socket;
      if (s) s.emit("sendMessage", { ...res.data, receiverId: currentChat.userDetails?.userId });
    } catch (err) { console.error("Send Error:", err); }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className={`fixed inset-0 text-white font-sans ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      {/* 📱 Sidebar */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-6 pt-12 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={getAvatar(user)} className="w-12 h-12 rounded-2xl border-2 border-cyan-500/20 object-cover" alt="" />
              <div>
                <h1 className="text-xl font-black italic text-cyan-500 uppercase">OnyxDrift</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{getDisplayName(user)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 mt-4 no-scrollbar pb-32">
          {conversations.map(c => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 active:bg-white/10 rounded-[2.2rem] cursor-pointer">
              <img src={getAvatar(c.userDetails)} className="w-14 h-14 rounded-2xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold truncate">{getDisplayName(c.userDetails)}</span>
                  <HiCheckBadge className="text-cyan-500" size={16}/>
                </div>
                <p className="text-xs text-zinc-500 truncate">{c.lastMessage?.text || "New Signal..."}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center">
            <button onClick={() => setActiveTab("chats")} className="text-cyan-500"><HiChatBubbleLeftRight size={28} /></button>
            <button onClick={() => setActiveTab("groups")} className="text-zinc-600"><HiUsers size={28} /></button>
            <button onClick={() => setActiveTab("settings")} className="text-zinc-600"><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      {/* 💬 Chat Window */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className={`fixed inset-0 z-[200] flex flex-col ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
            <header className="p-4 pt-10 flex items-center gap-3 border-b border-white/5 bg-black/80">
              <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={30}/></button>
              <img src={getAvatar(currentChat.userDetails)} className="w-10 h-10 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <h3 className="text-sm font-bold">{getDisplayName(currentChat.userDetails)}</h3>
                <p className="text-[9px] text-cyan-500 font-black flex items-center gap-1 uppercase"><HiOutlineLockClosed size={10}/> Encrypted</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-[1.5rem] max-w-[80%] ${m.senderId === user?.sub ? 'bg-cyan-600 rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 pb-12 bg-black/60">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-[2rem] border border-white/10">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type signal..." className="bg-transparent flex-1 px-4 outline-none text-sm" />
                <button type="submit" className="p-4 bg-cyan-500 rounded-full text-black"><HiOutlinePaperAirplane size={20} className="-rotate-45"/></button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;