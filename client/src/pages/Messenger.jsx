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
import GroupCallScreen from "./GroupCallScreen"; 

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
  const [activeCall, setActiveCall] = useState(null); 

  const scrollRef = useRef();
  // API URL থেকে ট্রেইলিং স্ল্যাশ রিমুভ করা হয়েছে
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  // নাম এবং অবতার হ্যান্ডলিং ফিক্সড
  const getDisplayName = (u) => u?.name || u?.nickname || "Unknown Drifter";
  const getAvatar = (u) => u?.avatar || u?.picture || `https://ui-avatars.com/api/?name=${getDisplayName(u)}&background=0D8ABC&color=fff`;

  const getAuthToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (e) {
      console.error("Token Error", e);
      return null;
    }
  }, [getAccessTokenSilently]);

  /* =================📡 SOCKET LISTENERS ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s) return;

    const handleIncomingCall = (data) => {
      const accept = window.confirm(`${data.callerName} is calling... Accept?`);
      if (accept) {
        setActiveCall({ 
          roomId: data.roomId, 
          name: data.callerName || "Unknown Drifter" 
        });
      }
    };

    const handleNewMessage = (data) => {
      // চ্যাট উইন্ডো খোলা থাকলে মেসেজ আপডেট হবে
      if(currentChat?._id === data.conversationId) {
        setMessages(prev => [...prev, data]);
      }
      // কনভারসেশন লিস্ট আপডেট করার জন্য পুনরায় ফেচ করা
      fetchConversations();
    };

    s.on("incomingCall", handleIncomingCall);
    s.on("getMessage", handleNewMessage);

    return () => {
      s.off("incomingCall", handleIncomingCall);
      s.off("getMessage", handleNewMessage);
    };
  }, [socket, currentChat]);

  /* =================📞 CALL HANDLERS ================= */
  const startCall = (chat) => {
    const roomId = chat._id;
    const receiverId = chat.isGroup ? chat._id : chat.userDetails?.userId;

    setActiveCall({
      roomId: roomId,
      name: chat.isGroup ? chat.name : getDisplayName(chat.userDetails)
    });

    const s = socket?.current || socket;
    if (s) {
      s.emit("initiateCall", { 
        roomId, 
        receiverId, 
        callerName: user.name,
        type: "video" 
      });
    }
  };

  /* =================📩 DATA FETCHING ================= */
  const fetchGroupMessages = async (groupId) => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      const s = socket?.current || socket;
      if (s) s.emit("joinGroup", groupId);
    } catch (err) { console.error("Group Fetch Error:", err); }
  };

  // ডাবল /messages পাথ এখানে ফিক্স করা হয়েছে
  const fetchMessages = async (convId) => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) { console.error("Message Fetch Error:", err); }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Conversation Fetch Error:", err); }
  }, [getAuthToken, API_URL]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat) return;
    
    const msgData = {
      senderId: user.sub,
      text: newMessage,
      conversationId: currentChat._id,
      isGroup: !!currentChat.isGroup,
      neuralMood: selectedMood,
      createdAt: new Date()
    };

    // অপ্টিমিস্টিক আপডেট
    setMessages((prev) => [...prev, { ...msgData, _id: Date.now().toString() }]);
    setNewMessage("");

    const s = socket?.current || socket;
    if (s) {
      s.emit("sendMessage", { 
        ...msgData, 
        receiverId: currentChat.isGroup ? null : currentChat.userDetails?.userId 
      });
    }

    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/messages`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageCount(prev => (prev + 1) % 101);
    } catch (err) { console.error("Send Error:", err); }
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
      
      {/* --- কল স্ক্রিন ওভারলে --- */}
      <AnimatePresence>
        {activeCall && (
          <GroupCallScreen 
            roomId={activeCall.roomId} 
            onHangup={() => {
                const s = socket?.current || socket;
                if(s) s.emit("endCall", { to: currentChat?.userDetails?.userId || currentChat?._id });
                setActiveCall(null);
            }} 
          />
        )}
      </AnimatePresence>

      {/* মেইন লিস্ট ভিউ */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden' : 'flex'}`}>
        <header className="p-5 pt-12 flex flex-col gap-3 bg-black/40 border-b border-white/5 backdrop-blur-3xl shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={getAvatar(user)} className="w-10 h-10 rounded-xl border border-cyan-500/30" alt="" />
              <div className="overflow-hidden">
                <h1 className="text-lg font-black italic text-cyan-500 uppercase tracking-tighter">ONYXDRIFT</h1>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 truncate w-32">
                   DRFT_{user?.sub?.split('|')[1]?.slice(-6) || "NULL"}
                </p>
              </div>
            </div>
            <button onClick={() => setIsIncognito(!isIncognito)} className={`p-2.5 rounded-xl transition-all ${isIncognito ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-500'}`}>
              <HiOutlineEyeSlash size={22}/>
            </button>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            <motion.div animate={{ width: `${messageCount}%` }} className="h-full bg-gradient-to-r from-cyan-600 to-blue-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {activeTab === "chats" ? (
            conversations.map(c => (
              <div key={c._id} onClick={() => setCurrentChat(c)} className="p-3.5 flex items-center gap-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-all bg-white/[0.02] border border-white/5">
                <img src={getAvatar(c.userDetails)} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-sm truncate text-zinc-200">{getDisplayName(c.userDetails)}</span>
                    <span className="text-[8px] text-cyan-600 font-black">SYNC_01</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{c.lastMessage?.text || "Waiting for signal..."}</p>
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

        <nav className="p-4 pb-10 flex justify-around items-center bg-black/80 backdrop-blur-2xl border-t border-white/5 shrink-0">
          <button onClick={() => setActiveTab("chats")} className={`p-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiChatBubbleLeftRight size={24} />
            <span className="text-[8px] font-black uppercase">Channels</span>
          </button>
          <button onClick={() => setActiveTab("groups")} className={`p-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiUsers size={24} />
            <span className="text-[8px] font-black uppercase">Nexus</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`p-3 flex flex-col items-center gap-1 transition-colors ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}>
            <HiCog6Tooth size={24} />
            <span className="text-[8px] font-black uppercase">Drift</span>
          </button>
        </nav>
      </div>

      {/* --- চ্যাট উইন্ডো --- */}
      <AnimatePresence>
        {currentChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed inset-0 z-[200] flex flex-col h-[100dvh] bg-[#02040a]">
            <header className="p-3 pt-12 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl shrink-0">
               <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2 active:scale-90 transition-transform"><HiOutlineChevronLeft size={28}/></button>
                 <img src={getAvatar(currentChat.userDetails || currentChat)} className="w-9 h-9 rounded-lg border border-cyan-500/20" alt="" />
                 <div>
                   <h3 className="font-bold text-xs truncate max-w-[120px]">{getDisplayName(currentChat.userDetails || currentChat)}</h3>
                   <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"/>
                      <p className="text-[8px] text-cyan-500 font-black uppercase">Linked</p>
                   </div>
                 </div>
               </div>
               <div className="flex gap-1">
                 <button onClick={() => startCall(currentChat)} className="text-zinc-400 p-2.5 hover:text-cyan-500 transition-colors"><FaPhone size={16}/></button>
                 <button onClick={() => startCall(currentChat)} className="text-zinc-400 p-2.5 hover:text-cyan-500 transition-colors"><HiOutlineVideoCamera size={22}/></button>
               </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-grainy">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] border transition-all ${m.senderId === user?.sub ? (moodStyles[m.neuralMood] || "bg-cyan-500/10 border-cyan-500/20") : "bg-white/5 border-white/10"}`}>
                    <p className="text-[13px] leading-relaxed">{m.text}</p>
                  </div>
                  <span className="text-[7px] text-zinc-600 mt-1 uppercase font-mono tracking-tighter">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} className="h-4" />
            </div>

            <div className="p-4 pb-10 bg-black/60 backdrop-blur-xl border-t border-white/5">
              <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />
              <div className="flex items-center gap-2 mt-4 bg-white/5 p-1.5 rounded-full border border-white/10 shadow-inner">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Transmit signal..." className="bg-transparent flex-1 px-4 outline-none text-white text-[13px] placeholder:text-zinc-600" />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="p-3 rounded-full bg-cyan-500 text-black active:scale-95 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
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