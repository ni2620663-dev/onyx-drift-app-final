import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiPlus, HiChatBubbleLeftRight, 
  HiUsers, HiCog6Tooth, HiOutlineChevronLeft, 
  HiOutlinePhone, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiShieldCheck, HiBolt, HiSparkles
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

import CallOverlay from "../components/Messenger/CallOverlay";

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [incomingCall, setIncomingCall] = useState(null);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final-u29m.onrender.com").replace(/\/$/, "");

  // --- Auto Scroll to Bottom ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Data Fetching ---
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("Conversation fetch error:", err);
      setConversations([]); 
    }
  }, [getAccessTokenSilently, API_URL]);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  // --- Socket Integration ---
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);
    
    s.on("getMessage", (data) => {
      if (currentChat?._id === data.conversationId) {
        setMessages((prev) => [...prev, data]);
      }
      fetchConversations();
    });

    return () => { 
      if (s) s.off("getMessage"); 
    };
  }, [socket, currentChat, user, fetchConversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat?._id) return;

    const msgData = {
      senderId: user.sub,
      senderName: user.name || user.nickname || "Drifter",
      text: newMessage,
      conversationId: currentChat._id,
      members: currentChat.members || []
    };

    // Optimistic UI Update
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");

    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", msgData);

    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { 
      console.error("Message send error:", err); 
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden z-[9999]">
      
      {/* --- Main List View --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-6 flex justify-between items-center bg-black/40 border-b border-white/5 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <img src={user?.picture} className="w-11 h-11 rounded-full border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]" alt="Profile" />
            <div>
              <h1 className="text-xl font-black italic text-cyan-500 uppercase tracking-tighter leading-none">OnyxDrift</h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Fast. Secure. Smart.</p>
            </div>
          </div>
          <button className="p-3 bg-zinc-900/50 rounded-2xl text-cyan-500 border border-white/10 active:scale-95 transition-all">
            <HiPlus size={24}/>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-4 mt-4">
          
          {/* 🔹 PREMIUM BIO CARD */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 rounded-[2.5rem] bg-gradient-to-br from-zinc-900/80 to-black border border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 opacity-10 text-cyan-500 rotate-12"><HiSparkles size={100}/></div>
            
            <h2 className="text-sm font-black text-cyan-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <HiBolt /> Next-Gen Messenger
            </h2>
            
            <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
              দ্রুত, নিরাপদ আর স্মার্ট মেসেঞ্জার। Chat, call আর privacy সব এক অ্যাপে। <br/>
              <span className="text-zinc-500 italic">Privacy আপনার, control আপনার। No ads. No tracking.</span>
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 p-2 rounded-2xl border border-white/5 text-center">
                <HiBolt className="mx-auto text-cyan-500 mb-1" size={16}/>
                <span className="text-[9px] font-black uppercase text-gray-400">Lightning</span>
              </div>
              <div className="bg-white/5 p-2 rounded-2xl border border-white/5 text-center">
                <HiShieldCheck className="mx-auto text-cyan-500 mb-1" size={16}/>
                <span className="text-[9px] font-black uppercase text-gray-400">Secure</span>
              </div>
              <div className="bg-white/5 p-2 rounded-2xl border border-white/5 text-center">
                <HiSparkles className="mx-auto text-cyan-500 mb-1" size={16}/>
                <span className="text-[9px] font-black uppercase text-gray-400">Premium</span>
              </div>
            </div>
          </motion.div>

          {/* --- Conversations --- */}
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-20 opacity-20 font-bold uppercase tracking-widest text-sm">No signals found</div>
            ) : (
              conversations.map(c => {
                const displayName = c.isGroup ? c.groupName : (c.userDetails?.name || c.userDetails?.nickname || "Neural Drifter");
                const displayPic = c.userDetails?.avatar || c.userDetails?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${c._id}`;
                
                return (
                  <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 hover:bg-zinc-900/60 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-white/5 group">
                      <img src={displayPic} className="w-14 h-14 rounded-[1.4rem] object-cover border border-white/5 shadow-lg" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-100 truncate">{displayName}</span>
                            <span className="text-[9px] text-cyan-500 font-black border border-cyan-500/30 px-1.5 rounded">STABLE</span>
                        </div>
                        <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage || "Encrypted signal established..."}</p>
                      </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- Bottom Nav --- */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-20 bg-[#111]/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[110] shadow-2xl">
           <button onClick={() => setActiveTab("chats")} className={`p-4 transition-all ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
           <button onClick={() => setActiveTab("groups")} className={`p-4 transition-all ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiUsers size={28} /></button>
           <button onClick={() => setActiveTab("settings")} className={`p-4 transition-all ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      {/* --- Chat Interface Overlay --- */}
      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 bg-[#050505] z-[200] flex flex-col">
           <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2 active:scale-90"><HiOutlineChevronLeft size={30}/></button>
                 <img src={currentChat.userDetails?.avatar || currentChat.userDetails?.picture} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                 <div className="min-w-0">
                    <h3 className="text-[15px] font-bold truncate">{currentChat.isGroup ? currentChat.groupName : (currentChat.userDetails?.name || "Drifter")}</h3>
                    <p className="text-[9px] text-cyan-500 uppercase font-black tracking-widest">End-to-End Secure</p>
                 </div>
              </div>
              <div className="flex gap-1">
                 <button className="p-3 text-cyan-500 hover:bg-cyan-500/10 rounded-2xl transition-colors"><HiOutlineVideoCamera size={24}/></button>
                 <button className="p-3 text-zinc-400"><HiOutlinePhone size={24}/></button>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] shadow-sm ${m.senderId === user?.sub ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-white/5'}`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
           </div>

           <div className="p-4 pb-10 bg-black/60 backdrop-blur-md">
              <div className="flex items-center gap-3 bg-zinc-900/80 p-2 rounded-[2.5rem] border border-white/10 focus-within:border-cyan-500/50 transition-all">
                 <input 
                   value={newMessage} 
                   onChange={(e) => setNewMessage(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                   placeholder="Type a message..." 
                   className="bg-transparent flex-1 px-4 outline-none text-white text-sm" 
                 />
                 <button onClick={handleSend} className="p-3.5 bg-cyan-500 text-black rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-90 transition-all">
                    <HiOutlinePaperAirplane size={22} className="-rotate-45" />
                 </button>
              </div>
           </div>
        </motion.div>
      )}
      </AnimatePresence>

      <CallOverlay incomingCall={incomingCall} setIncomingCall={setIncomingCall} ringtoneRef={ringtoneRef} navigate={navigate} />
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default Messenger;