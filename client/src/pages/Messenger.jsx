import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineChevronLeft, HiPlus, HiXMark, HiMagnifyingGlass,
  HiOutlineInformationCircle, HiOutlinePhoto, HiOutlineMicrophone,
  HiOutlineCamera, HiOutlineTrash, HiOutlineEye,
  HiChatBubbleLeftRight, HiUsers, HiCog6Tooth
} from "react-icons/hi2";

const Messenger = ({ socket }) => { 
  const { user, getAccessTokenSilently, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();
  
  // States
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Search logic
  const [activeUsers, setActiveUsers] = useState([]); 
  const [selectedStory, setSelectedStory] = useState(null); 
  const [activeTab, setActiveTab] = useState("chats");
  const [isTyping, setIsTyping] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const storyInputRef = useRef(null); 
  const imageInputRef = useRef(null); 
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /* =================📡 SOCKET LOGIC ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);
    s.on("getUsers", (users) => setActiveUsers(users));

    const handleMessage = (data) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(m => (m.tempId && m.tempId === data.tempId) || (m._id && m._id === data._id));
        if (isDuplicate) return prev;
        return [...prev, data];
      });
    };

    s.on("getMessage", handleMessage);
    
    s.on("displayTyping", (data) => {
      if (currentChat?.members?.includes(data.senderId)) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    s.on("incomingCall", (data) => {
      setIncomingCall(data);
      ringtoneRef.current.play().catch(e => console.log("Audio blocked"));
    });

    return () => {
      s.off("getUsers");
      s.off("getMessage");
      s.off("displayTyping");
      s.off("incomingCall");
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* =================🔍 SEARCH FILTER LOGIC ================= */
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c._id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  /* =================✉️ HANDLERS ================= */
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Typing Emit Logic
    const s = socket?.current || socket;
    if (s && currentChat) {
      s.emit("typing", {
        senderId: user.sub,
        receiverId: currentChat.members.find(m => m !== user.sub)
      });
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const s = socket?.current || socket;
    const tempId = `temp_${Date.now()}`;

    const msgData = {
      tempId, senderId: user.sub, receiverId, text: newMessage,
      conversationId: currentChat._id, createdAt: new Date().toISOString(),
      status: "sent" // Initial status
    };

    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
    if (s) s.emit("sendMessage", msgData);

    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error("Sync failed", err); }
  };

  const startCall = (type) => {
    if (!currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const roomId = `room_${Date.now()}`;
    const s = socket?.current || socket;
    if (s) {
      s.emit("callUser", { userToCall: receiverId, from: user.sub, name: user.name, type, roomId });
    }
    navigate(`/call/${roomId}`);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  /* =================📥 DATA FETCHING ================= */
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.error(err); }
  }, [getAccessTokenSilently]);

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden z-[99999]">
      
      <input type="file" ref={storyInputRef} onChange={(e) => alert("Uploading Story...")} className="hidden" accept="image/*,video/*" />
      <input type="file" ref={imageInputRef} onChange={(e) => alert("Sending Image...")} className="hidden" accept="image/*" />

      {/* --- MAIN MOBILE VIEW --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        
        <header className="p-4 flex justify-between items-center bg-black">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800">
                <img src={user?.picture} alt="" />
             </div>
             <h1 className="text-2xl font-extrabold tracking-tight">
               {activeTab === "chats" ? "Chats" : activeTab === "stories" ? "Stories" : "Settings"}
             </h1>
          </div>
          <div className="flex gap-2">
             <button onClick={() => storyInputRef.current.click()} className="p-2 bg-zinc-900 rounded-full active:scale-95 transition-all"><HiOutlineCamera size={22}/></button>
             <button onClick={() => storyInputRef.current.click()} className="p-2 bg-zinc-900 rounded-full active:scale-95 transition-all"><HiPlus size={22}/></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          {activeTab === "chats" && (
            <>
              {/* Search Logic Integrated */}
              <div className="px-4 mb-4">
                <div className="bg-zinc-900 rounded-full py-2 px-4 flex items-center gap-2 border border-transparent focus-within:border-zinc-700 transition-all">
                   <HiMagnifyingGlass className="text-zinc-500" />
                   <input 
                    type="text" 
                    placeholder="Search conversations" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full" 
                   />
                </div>
              </div>

              {/* Active Users Story Bar */}
              <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar mb-4">
                 <div onClick={() => storyInputRef.current.click()} className="flex flex-col items-center gap-1 min-w-[65px]">
                    <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800"><HiPlus size={24}/></div>
                    <span className="text-[11px] text-zinc-500">Your Story</span>
                 </div>
                 {activeUsers.filter(u => u.userId !== user?.sub).map((au, i) => (
                   <div key={i} onClick={() => setSelectedStory({ name: `User_${i}`, image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${au.userId}` })} className="flex flex-col items-center gap-1 min-w-[65px] cursor-pointer">
                      <div className="relative p-0.5 border-2 border-blue-600 rounded-full animate-in fade-in duration-500">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${au.userId}`} className="w-12 h-12 rounded-full bg-zinc-800" alt=""/>
                         <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></div>
                      </div>
                      <span className="text-[11px] text-zinc-300 truncate w-14 text-center">Active</span>
                   </div>
                 ))}
              </div>

              {/* Conversations List with Filter */}
              <div className="space-y-1">
                {filteredConversations.length > 0 ? filteredConversations.map(c => (
                  <div key={c._id} onClick={() => setCurrentChat(c)} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900 active:bg-zinc-800 transition-colors cursor-pointer">
                     <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden border border-zinc-800 shadow-sm">
                           <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${c._id}`} alt=""/>
                        </div>
                        {activeUsers.some(au => c.members.includes(au.userId) && au.userId !== user?.sub) && (
                           <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>
                        )}
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                           <span className="font-bold text-[15px] truncate">Node_{c._id.slice(-5)}</span>
                           <span className="text-[11px] text-zinc-500">4:20 PM</span>
                        </div>
                        <p className="text-[13px] text-zinc-500 truncate">Tap to start messaging</p>
                     </div>
                  </div>
                )) : (
                  <div className="text-center text-zinc-600 mt-10 text-sm italic">No conversations found</div>
                )}
              </div>
            </>
          )}

          {activeTab === "stories" && (
             <div className="p-4 grid grid-cols-2 gap-3">
                <div onClick={() => storyInputRef.current.click()} className="aspect-[9/16] bg-zinc-900 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 active:scale-95 transition-all">
                   <HiPlus size={30} className="text-blue-500" />
                   <span className="text-sm font-bold mt-2">Add Story</span>
                </div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[9/16] bg-zinc-800 rounded-2xl overflow-hidden relative group">
                     <img src={`https://picsum.photos/400/700?random=${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt=""/>
                     <div className="absolute top-2 left-2 w-8 h-8 rounded-full border-2 border-blue-500 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt=""/>
                     </div>
                  </div>
                ))}
             </div>
          )}

          {activeTab === "settings" && (
             <div className="p-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-900 overflow-hidden mb-4 shadow-xl">
                   <img src={user?.picture} alt=""/>
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <div className="w-full mt-8 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                   <button className="w-full p-4 text-left border-b border-zinc-800 flex justify-between active:bg-zinc-800">Dark Mode <span className="text-blue-500">On</span></button>
                   <button className="w-full p-4 text-left border-b border-zinc-800 active:bg-zinc-800">Active Status</button>
                   <button onClick={handleLogout} className="w-full p-4 text-left text-red-500 font-bold active:bg-red-500/10">Log Out</button>
                </div>
             </div>
          )}
        </div>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-t border-zinc-900 flex justify-around items-center z-[100] px-6">
           <button onClick={() => setActiveTab("chats")} className={`flex flex-col items-center ${activeTab === "chats" ? 'text-blue-500' : 'text-zinc-500'}`}>
              <HiChatBubbleLeftRight size={26} />
              <span className="text-[10px] mt-1 font-medium">Chats</span>
           </button>
           <button onClick={() => setActiveTab("stories")} className={`flex flex-col items-center ${activeTab === "stories" ? 'text-blue-500' : 'text-zinc-500'}`}>
              <HiUsers size={26} />
              <span className="text-[10px] mt-1 font-medium">Stories</span>
           </button>
           <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center ${activeTab === "settings" ? 'text-blue-500' : 'text-zinc-500'}`}>
              <HiCog6Tooth size={26} />
              <span className="text-[10px] mt-1 font-medium">Settings</span>
           </button>
        </div>
      </div>

      {/* --- CHAT OVERLAY (FULL SCREEN) --- */}
      {currentChat && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col">
           <header className="p-3 flex justify-between items-center border-b border-zinc-900">
              <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentChat(null)} className="text-blue-500 p-1"><HiOutlineChevronLeft size={28}/></button>
                 <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentChat._id}`} alt=""/>
                 </div>
                 <div className="leading-tight">
                    <h3 className="text-sm font-bold truncate w-24">Node_{currentChat._id.slice(-5)}</h3>
                    <span className="text-[10px] text-green-500">Active now</span>
                 </div>
              </div>
              <div className="flex gap-4 text-blue-500 px-2">
                 <button onClick={() => startCall('voice')} className="active:scale-90 transition-transform"><HiOutlinePhone size={24}/></button>
                 <button onClick={() => startCall('video')} className="active:scale-90 transition-transform"><HiOutlineVideoCamera size={24}/></button>
                 <HiOutlineInformationCircle size={24}/>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex flex-col items-end max-w-[75%]">
                    <div className={`px-4 py-2 rounded-[20px] text-[15px] shadow-sm ${
                      m.senderId === user?.sub ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white'
                    }`}>
                      {m.text}
                    </div>
                    {/* Tick Mark Indicator (Real Feel) */}
                    {m.senderId === user?.sub && (
                      <span className="text-[9px] text-zinc-600 mt-1 mr-1">
                        {m.status === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-1 ml-2 items-center text-zinc-500">
                  <div className="flex gap-1 bg-zinc-800 px-3 py-2 rounded-full scale-75">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
           </div>

           <div className="p-3 pb-8 flex items-center gap-2 bg-black border-t border-zinc-900">
              <button onClick={() => storyInputRef.current.click()} className="text-blue-500"><HiPlus size={24}/></button>
              <button onClick={() => imageInputRef.current.click()} className="text-blue-500"><HiOutlineCamera size={24}/></button>
              <div className="flex-1 bg-zinc-900 rounded-full px-4 py-2 flex items-center focus-within:ring-1 ring-blue-500/50 transition-all">
                 <input 
                    value={newMessage} 
                    onChange={handleInputChange} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Aa" 
                    className="bg-transparent flex-1 outline-none text-sm" 
                 />
                 <span className="text-blue-500 cursor-pointer">😊</span>
              </div>
              <button onClick={handleSend} disabled={!newMessage.trim()} className={newMessage.trim() ? "text-blue-500" : "text-zinc-700"}>
                <HiOutlinePaperAirplane className="rotate-45" size={24}/>
              </button>
           </div>
        </div>
      )}

      {/* --- STORY VIEWER --- */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black">
             <div className="absolute top-10 left-0 right-0 px-4 flex justify-between items-center z-[310]">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden">
                      <img src={selectedStory.image} alt=""/>
                   </div>
                   <span className="font-bold text-sm shadow-black drop-shadow-lg">{selectedStory.name}</span>
                </div>
                <button onClick={() => setSelectedStory(null)} className="p-2 bg-white/10 rounded-full backdrop-blur-md text-white"><HiXMark size={24}/></button>
             </div>
             <img src={selectedStory.image} className="w-full h-full object-contain shadow-2xl" alt=""/>
             <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 text-white/70">
                <button className="flex flex-col items-center"><HiOutlineEye size={22}/><span className="text-[10px]">24 Views</span></button>
                <button onClick={() => setSelectedStory(null)} className="flex flex-col items-center text-red-500"><HiOutlineTrash size={22}/><span className="text-[10px]">Delete</span></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CALL UI --- */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[400] bg-zinc-900/95 backdrop-blur-2xl flex flex-col items-center justify-center">
             <div className="w-24 h-24 rounded-full bg-blue-600 animate-pulse mb-8 border-4 border-white/10" />
             <h2 className="text-2xl font-bold">{incomingCall.senderName}</h2>
             <p className="text-blue-500 mt-2 animate-bounce">Incoming Video Call...</p>
             <div className="flex gap-16 mt-20">
                <button onClick={() => { ringtoneRef.current.pause(); setIncomingCall(null); }} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><HiXMark size={32}/></button>
                <button onClick={() => { ringtoneRef.current.pause(); navigate(`/call/${incomingCall.roomId}`); setIncomingCall(null); }} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><HiOutlinePhone size={32}/></button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Messenger;