import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiMagnifyingGlass, HiOutlineCamera, HiPlus,
  HiChatBubbleLeftRight, HiUsers, HiCog6Tooth,
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera
} from "react-icons/hi2";
import { AnimatePresence } from "framer-motion";

// কম্পোনেন্ট ইমপোর্ট
import StorySection from "../components/Messenger/StorySection";
import ChatInput from "../components/Messenger/ChatInput";
import CallOverlay from "../components/Messenger/CallOverlay";
import StoryEditor from "../components/Messenger/StoryEditor";

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();

  // --- STATES ---
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("chats");
  const [isTyping, setIsTyping] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [tempStoryFile, setTempStoryFile] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const storyInputRef = useRef(null);
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /* =================📡 SOCKET LOGIC ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);
    s.on("getUsers", (users) => setActiveUsers(users));

    s.on("getMessage", (data) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(m => (m.tempId && m.tempId === data.tempId) || (m._id && m._id === data._id));
        if (isDuplicate) return prev;
        return [...prev, data];
      });
    });

    s.on("displayTyping", (data) => {
      if (currentChat?.members?.includes(data.senderId)) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    s.on("incomingCall", (data) => {
      setIncomingCall(data);
      ringtoneRef.current.play().catch(() => console.log("Audio play blocked"));
    });

    return () => {
      s.off("getUsers"); s.off("getMessage"); s.off("displayTyping"); s.off("incomingCall");
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* =================🔍 SEARCH LOGIC (FIXED) ================= */
  // এখানে কথোপকথনের মেম্বারদের নাম বা আইডি দিয়ে সার্চ করার ব্যবস্থা করা হয়েছে
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => {
      const chatName = c.userDetails?.name || `Node_${c._id.slice(-5)}`;
      return chatName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c._id.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);

  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.error("Fetch Error:", err); }
  }, [getAccessTokenSilently]);

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);

  /* =================✉️ HANDLERS ================= */
  const handleStorySelect = (e) => {
    const file = e.target.files[0];
    if (file) setTempStoryFile(file);
  };

  const handlePostStory = async (file, text, filter) => {
    setIsUploading(true);
    try {
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("text", text || "");
      formData.append("filter", filter || "none");
      formData.append("userId", user.sub);
      formData.append("userName", user.name);
      formData.append("userPicture", user.picture);

      await axios.post(`${API_URL}/api/stories/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Story shared successfully! 🚀");
      setTempStoryFile(null);
    } catch (err) {
      console.error("Story Upload Failed:", err);
      alert("Failed to share story. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const s = socket?.current || socket;
    if (s && currentChat) {
      const receiverId = currentChat.members.find(m => m !== user.sub);
      s.emit("typing", { senderId: user.sub, receiverId });
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
      status: "sent"
    };

    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
    if (s) s.emit("sendMessage", msgData);

    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error("Message Sync Failed", err); }
  };

  const startCall = (type) => {
    if (!currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const roomId = `room_${Date.now()}`;
    const s = socket?.current || socket;
    if (s) {
      s.emit("callUser", { userToCall: receiverId, from: user.sub, senderName: user.name, type, roomId });
    }
    navigate(`/call/${roomId}`);
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden z-[99999]">
      
      <input 
        type="file" 
        ref={storyInputRef} 
        onChange={handleStorySelect} 
        className="hidden" 
        accept="image/*" 
      />

      {/* --- MAIN LIST VIEW --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800">
              <img src={user?.picture} alt="profile" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {activeTab === "chats" ? "Chats" : activeTab === "stories" ? "Stories" : "Settings"}
            </h1>
          </div>
          <div className="flex gap-2">
             <button onClick={() => storyInputRef.current.click()} className="p-2 bg-zinc-900 rounded-full active:scale-95"><HiOutlineCamera size={22}/></button>
             <button onClick={() => storyInputRef.current.click()} className="p-2 bg-zinc-900 rounded-full active:scale-95"><HiPlus size={22}/></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          {activeTab === "chats" && (
            <>
              <div className="px-4 mb-4">
                <div className="bg-zinc-900 rounded-full py-2 px-4 flex items-center gap-2 border border-white/5 focus-within:border-blue-500/50 transition-all">
                   <HiMagnifyingGlass className="text-zinc-500" />
                   <input 
                    type="text" 
                    placeholder="Search drifters or nodes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full text-white" 
                   />
                </div>
              </div>

              <StorySection activeUsers={activeUsers} user={user} storyInputRef={storyInputRef} />

              <div className="mt-4">
                {filteredConversations.length > 0 ? filteredConversations.map(c => (
                  <div key={c._id} onClick={() => setCurrentChat(c)} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900/50 cursor-pointer transition-colors active:bg-zinc-900">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden border border-zinc-800">
                           <img src={c.userDetails?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c._id}`} alt="" className="w-full h-full object-cover"/>
                        </div>
                        {activeUsers.some(au => c.members.includes(au.userId) && au.userId !== user?.sub) && (
                           <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-[15px] text-zinc-100">{c.userDetails?.name || `Node_${c._id.slice(-5)}`}</span>
                        </div>
                        <p className="text-[12px] text-zinc-500 truncate">Tap to open secure link</p>
                      </div>
                  </div>
                )) : (
                  <div className="text-center mt-10 text-zinc-600 text-xs font-bold uppercase tracking-widest">No signals found</div>
                )}
              </div>
            </>
          )}

          {activeTab === "settings" && (
             <div className="p-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-900 overflow-hidden mb-4 shadow-xl">
                   <img src={user?.picture} alt="" className="w-full h-full object-cover"/>
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-zinc-500 text-xs mb-8">{user?.email}</p>
                <div className="w-full space-y-2">
                   <button onClick={() => logout()} className="w-full p-4 bg-zinc-900/50 rounded-2xl text-left text-red-500 font-bold hover:bg-red-500/10 transition-colors border border-white/5">Log Out</button>
                </div>
             </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-zinc-900 flex justify-around items-center px-6 z-50">
           <button onClick={() => setActiveTab("chats")} className={activeTab === "chats" ? 'text-blue-500' : 'text-zinc-500'}><HiChatBubbleLeftRight size={26} /></button>
           <button onClick={() => setActiveTab("stories")} className={activeTab === "stories" ? 'text-blue-500' : 'text-zinc-500'}><HiUsers size={26} /></button>
           <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? 'text-blue-500' : 'text-zinc-500'}><HiCog6Tooth size={26} /></button>
        </div>
      </div>

      {/* --- CHAT VIEW --- */}
      {currentChat && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-in slide-in-from-right duration-300">
           <header className="p-3 flex justify-between items-center border-b border-zinc-900 bg-black/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentChat(null)} className="text-blue-500 p-1 active:scale-90 transition-transform"><HiOutlineChevronLeft size={28}/></button>
                 <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img src={currentChat.userDetails?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentChat._id}`} alt="" className="w-full h-full object-cover"/>
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-sm font-bold">{currentChat.userDetails?.name || `Node_${currentChat._id.slice(-5)}`}</h3>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Active Link</span>
                 </div>
              </div>
              <div className="flex gap-4 text-blue-500 px-2">
                 <button onClick={() => startCall('voice')} className="active:scale-90 transition-transform"><HiOutlinePhone size={22}/></button>
                 <button onClick={() => startCall('video')} className="active:scale-90 transition-transform"><HiOutlineVideoCamera size={22}/></button>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-[20px] max-w-[80%] text-[14px] leading-relaxed shadow-sm ${m.senderId === user?.sub ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-zinc-500 ml-2 animate-pulse font-bold italic">Identity Typing...</div>}
              <div ref={scrollRef} />
           </div>

           <ChatInput 
              newMessage={newMessage} handleSend={handleSend} 
              handleInputChange={handleInputChange} onFileSelect={() => {}}
           />
        </div>
      )}

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {tempStoryFile && (
          <StoryEditor 
            selectedFile={tempStoryFile} 
            onCancel={() => setTempStoryFile(null)} 
            onPost={handlePostStory}
            isUploading={isUploading}
          />
        )}
      </AnimatePresence>

      <CallOverlay 
        incomingCall={incomingCall} setIncomingCall={setIncomingCall} 
        ringtoneRef={ringtoneRef} navigate={navigate} 
      />

      {isUploading && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-black uppercase tracking-widest text-blue-500">Transmitting Signal...</p>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Messenger;