import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { 
  HiChatBubbleLeftRight, HiCog6Tooth, 
  HiOutlineChevronLeft, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiOutlineEyeSlash, 
  HiUsers
} from "react-icons/hi2";
import { FaPhone } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

// Neural Components
import MoodSelector from "./MoodSelector";
import GroupMessenger from "./GroupMessenger";
import GroupCallScreen from "./GroupCallScreen"; // আপনার তৈরি করা কল স্ক্রিন

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); 
  const [selectedMood, setSelectedMood] = useState("Neural-Flow");
  const [isIncognito, setIsIncognito] = useState(false);
  const [messageCount, setMessageCount] = useState(0); 
  
  // কলিং স্টেট
  const [activeCall, setActiveCall] = useState(null); 

  const scrollRef = useRef();
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  const getDisplayName = (u) => u?.name || u?.nickname || "Drifter";
  const getAvatar = (u) => u?.avatar || u?.picture || `https://ui-avatars.com/api/?name=${getDisplayName(u)}&background=0D8ABC&color=fff`;

  const getAuthToken = useCallback(async () => {
    return await getAccessTokenSilently({
      authorizationParams: { audience: "https://onyx-drift-api.com" },
    });
  }, [getAccessTokenSilently]);

  // ১. গ্রুপ চ্যাট হিস্ট্রি
  const fetchGroupMessages = async (groupId) => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      const s = socket?.current || socket;
      if (s) s.emit("joinGroup", groupId);
    } catch (err) { console.error("Neural link broken:", err); }
  };

  // ২. পার্সোনাল চ্যাট হিস্ট্রি
  const fetchMessages = async (convId) => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, [getAuthToken, API_URL]);

  // ৩. মেসেজ পাঠানো
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const msgData = {
      senderId: user.sub,
      text: newMessage,
      conversationId: currentChat._id,
      isGroup: currentChat.isGroup || false,
      neuralMood: selectedMood,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, { ...msgData, _id: Date.now().toString() }]);
    setNewMessage("");
    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", { ...msgData, receiverId: currentChat.isGroup ? null : currentChat.userDetails?.userId });
    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageCount(prev => (prev + 1) % 101);
    } catch (err) { console.error(err); }
  };

  // ৪. কল হ্যান্ডলার
  const startCall = (chat) => {
    setActiveCall({
      roomId: chat._id,
      name: chat.name || getDisplayName(chat.userDetails)
    });
    const s = socket?.current || socket;
    if (s) s.emit("initiateCall", { roomId: chat._id, caller: user.sub });
  };

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);
  useEffect(() => { 
    if (currentChat) {
      currentChat.isGroup ? fetchGroupMessages(currentChat._id) : fetchMessages(currentChat._id);
    }
  }, [currentChat]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const moodStyles = {
    "Enraged": "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50 bg-red-900/20",
    "Neural-Flow": "shadow-[0_0_15px_rgba(6,182,212,0.4)] border-cyan-500/50 bg-cyan-900/20",
    "Ecstatic": "shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/50 bg-purple-900/20",
  };

  return (
    <div className={`fixed inset-0 text-white h-[100dvh] overflow-hidden ${isIncognito ? 'bg-[#0a0010]' : 'bg-[#02040a]'}`}>
      
      {/* কল স্ক্রিন ওভারলে */}
      <AnimatePresence>
        {activeCall && (
          <GroupCallScreen 
            roomId={activeCall.roomId} 
            onHangup={() => setActiveCall(null)} 
          />
        )}
      </AnimatePresence>

      {/* মেইন ভিউ */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden' : 'flex'}`}>
        <header className="p-5 pt-10 flex flex-col gap-3 bg-black/40 border-b border-white/5 backdrop-blur-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={getAvatar(user)} className="w-10 h-10 rounded-xl border border-cyan-500/30" alt="" />
              <div>
                <h1 className="text-lg font-black italic text-cyan-500">ONYXDRIFT</h1>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">ID: {user?.sub?.slice(-8)}</p>
              </div>
            </div>
            <button onClick={() => setIsIncognito(!isIncognito)} className={`p-2.5 rounded-xl ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
              <HiOutlineEyeSlash size={22}/>
            </button>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            <motion.div animate={{ width: `${messageCount}%` }} className="h-full bg-gradient-to-r from-cyan-600 to-blue-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {activeTab === "chats" ? (
            conversations.map(c => (
              <div key={c._id} onClick={() => setCurrentChat(c)} className="p-3.5 flex items-center gap-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-all bg-white/[0.02] mb-2 border border-white/5">
                <img src={getAvatar(c.userDetails)} className="w-12 h-12 rounded-xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-sm truncate">{getDisplayName(c.userDetails)}</span>
                    <span className="text-[8px] text-zinc-600 font-mono">RANK_{c.userDetails?.neuralRank || 0}</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{c.lastMessage?.text || "Awaiting signal..."}</p>
                </div>
              </div>
            ))
          ) : (
            <GroupMessenger 
              socket={socket} API_URL={API_URL} getAuthToken={getAuthToken} 
              onSelectGroup={(g) => setCurrentChat({...g, isGroup: true, userDetails: {name: g.name}})}
            />
          )}
        </div>

        <nav className="p-4 pb-8 flex justify-around items-center bg-black/80 backdrop-blur-2xl border-t border-white/5">
          <button onClick={() => setActiveTab("chats")} className={`p-3 flex flex-col items-center gap-1 ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiChatBubbleLeftRight size={24} />
            <span className="text-[8px] font-black uppercase">Chats</span>
          </button>
          <button onClick={() => setActiveTab("groups")} className={`p-3 flex flex-col items-center gap-1 ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiUsers size={24} />
            <span className="text-[8px] font-black uppercase">Groups</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`p-3 flex flex-col items-center gap-1 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiCog6Tooth size={24} />
            <span className="text-[8px] font-black uppercase">Drift</span>
          </button>
        </nav>
      </div>

      {/* চ্যাট উইন্ডো */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-[200] flex flex-col h-[100dvh] bg-[#02040a]">
            <header className="p-3 pt-10 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl shrink-0">
               <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={28}/></button>
                 <img src={getAvatar(currentChat.userDetails || currentChat)} className="w-9 h-9 rounded-lg" alt="" />
                 <div>
                   <h3 className="font-bold text-xs truncate max-w-[100px]">{getDisplayName(currentChat.userDetails || currentChat)}</h3>
                   <p className="text-[8px] text-cyan-500 font-black uppercase animate-pulse">Linked</p>
                 </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => startCall(currentChat)} className="text-zinc-400 p-2 hover:text-cyan-500 transition-colors"><FaPhone size={18}/></button>
                 <button onClick={() => startCall(currentChat)} className="text-zinc-400 p-2 hover:text-cyan-500 transition-colors"><HiOutlineVideoCamera size={22}/></button>
               </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-[1.4rem] max-w-[85%] border transition-all ${moodStyles[m.neuralMood] || "bg-white/10"}`}>
                    <p className="text-[13px]">{m.text}</p>
                  </div>
                  <span className="text-[7px] text-zinc-600 mt-1 uppercase font-mono">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={scrollRef} className="h-2" />
            </div>

            <div className="p-3 pb-8 bg-black/60 backdrop-blur-xl border-t border-white/5">
              <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />
              <div className="flex items-center gap-2 mt-3 bg-white/5 p-1.5 rounded-full border border-white/10">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Send neural signal..." className="bg-transparent flex-1 px-3 outline-none text-white text-[13px]" />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="p-3 rounded-full bg-cyan-500 text-black active:scale-90 transition-all">
                  <HiOutlinePaperAirplane size={18} className="-rotate-45" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messenger;