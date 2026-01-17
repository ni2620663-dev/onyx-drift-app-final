import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiMagnifyingGlass, HiOutlineCamera, HiPlus,
  HiChatBubbleLeftRight, HiUsers, HiCog6Tooth,
  HiOutlineChevronLeft, HiOutlinePhone, HiOutlineVideoCamera, HiOutlineInformationCircle
} from "react-icons/hi2";
import { AnimatePresence } from "framer-motion";

// সঠিক পাথ অনুযায়ী কম্পোনেন্টগুলো ইমপোর্ট করা হয়েছে
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
  const [isUploading, setIsUploading] = useState(false); // আপলোড ইন্ডিকেটর

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

  /* =================🔍 SEARCH & DATA FETCH ================= */
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c._id.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      
      // ১. Cloudinary-তে ছবি আপলোড করার জন্য FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("text", text || "");
      formData.append("filter", filter || "none");
      formData.append("userId", user.sub);
      formData.append("userName", user.name);
      formData.append("userPicture", user.picture);

      // ২. ব্যাকএন্ড API-তে পাঠানো (ব্যাকএন্ড Cloudinary হ্যান্ডেল করবে)
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
      s.emit("typing", { senderId: user.sub, receiverId: currentChat.members.find(m => m !== user.sub) });
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
      
      {/* Hidden File Input for Story */}
      <input 
        type="file" 
        ref={storyInputRef} 
        onChange={handleStorySelect} 
        className="hidden" 
        accept="image/*" 
      />

      {/* --- MAIN MOBILE VIEW --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-zinc-700 overflow-hidden bg-zinc-800">
              <img src={user?.picture} alt="profile" />
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

        <div className="flex-1 overflow-y-auto pb-24">
          {activeTab === "chats" && (
            <>
              <div className="px-4 mb-4">
                <div className="bg-zinc-900 rounded-full py-2 px-4 flex items-center gap-2">
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

              <StorySection activeUsers={activeUsers} user={user} storyInputRef={storyInputRef} />

              <div className="space-y-1">
                {filteredConversations.map(c => (
                  <div key={c._id} onClick={() => setCurrentChat(c)} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900 cursor-pointer">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden border border-zinc-800 shadow-sm">
                           <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${c._id}`} alt=""/>
                        </div>
                        {activeUsers.some(au => c.members.includes(au.userId) && au.userId !== user?.sub) && (
                           <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden text-left">
                        <span className="font-bold text-[15px] block">Node_{c._id.slice(-5)}</span>
                        <p className="text-[13px] text-zinc-500 truncate">Tap to start messaging</p>
                      </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "settings" && (
             <div className="p-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-900 overflow-hidden mb-4 shadow-xl">
                   <img src={user?.picture} alt=""/>
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <div className="w-full mt-8 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                   <button onClick={() => logout()} className="w-full p-4 text-left text-red-500 font-bold active:bg-red-500/10 transition-colors">Log Out</button>
                </div>
             </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-t border-zinc-900 flex justify-around items-center px-6">
           <button onClick={() => setActiveTab("chats")} className={activeTab === "chats" ? 'text-blue-500' : 'text-zinc-500'}><HiChatBubbleLeftRight size={26} /></button>
           <button onClick={() => setActiveTab("stories")} className={activeTab === "stories" ? 'text-blue-500' : 'text-zinc-500'}><HiUsers size={26} /></button>
           <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? 'text-blue-500' : 'text-zinc-500'}><HiCog6Tooth size={26} /></button>
        </div>
      </div>

      {/* --- CHAT OVERLAY --- */}
      {currentChat && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col">
           <header className="p-3 flex justify-between items-center border-b border-zinc-900">
              <div className="flex items-center gap-2">
                 <button onClick={() => setCurrentChat(null)} className="text-blue-500 p-1"><HiOutlineChevronLeft size={28}/></button>
                 <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentChat._id}`} alt=""/>
                 </div>
                 <h3 className="text-sm font-bold">Node_{currentChat._id.slice(-5)}</h3>
              </div>
              <div className="flex gap-4 text-blue-500 px-2">
                 <button onClick={() => startCall('voice')}><HiOutlinePhone size={24}/></button>
                 <button onClick={() => startCall('video')}><HiOutlineVideoCamera size={24}/></button>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-[20px] max-w-[75%] ${m.senderId === user?.sub ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-xs text-zinc-500 ml-2 animate-pulse">Typing...</div>}
              <div ref={scrollRef} />
           </div>

           <ChatInput 
             newMessage={newMessage} handleSend={handleSend} 
             handleInputChange={handleInputChange} onFileSelect={() => {}}
           />
        </div>
      )}

      {/* --- EXTERNAL OVERLAYS (STORY EDITOR & CALL) --- */}
      <AnimatePresence>
        {tempStoryFile && (
          <StoryEditor 
            selectedFile={tempStoryFile} 
            onCancel={() => setTempStoryFile(null)} 
            onPost={handlePostStory} // আপলোড ফাংশন যুক্ত করা হয়েছে
            isUploading={isUploading}
          />
        )}
      </AnimatePresence>

      <CallOverlay 
        incomingCall={incomingCall} setIncomingCall={setIncomingCall} 
        ringtoneRef={ringtoneRef} navigate={navigate} 
      />

      {/* Loading Overlay for Story Upload */}
      {isUploading && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Uploading Story...</p>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Messenger;