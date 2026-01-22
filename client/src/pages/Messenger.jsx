import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiMagnifyingGlass, HiPlus, HiChatBubbleLeftRight, 
  HiUsers, HiCog6Tooth, HiOutlineChevronLeft, 
  HiOutlinePhone, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiUserGroup, 
  HiOutlinePhoto
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

// কম্পোনেন্ট ইমপোর্ট
import CallOverlay from "../components/Messenger/CallOverlay";
import GroupCallScreen from "../components/GroupCallScreen"; // এটি নিশ্চিত করুন আছে

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // --- STATES ---
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showGroupCall, setShowGroupCall] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [incomingCall, setIncomingCall] = useState(null);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /* =================📡 SOCKET LOGIC ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);

    s.on("getMessage", (data) => {
      // যদি ইউজার ওই চ্যাটে থাকে তবে মেসেজ দেখাও
      if (currentChat?._id === data.conversationId) {
        setMessages((prev) => [...prev, data]);
      }
      fetchConversations(); // চ্যাট লিস্ট আপডেট (Last message এর জন্য)
    });

    s.on("incomingGroupCall", (data) => {
      setIncomingCall({ ...data, isGroup: true });
      ringtoneRef.current.play().catch(() => {});
    });

    return () => {
      s.off("getMessage");
      s.off("incomingGroupCall");
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =================📦 DATA FETCHING ================= */
  
  // কনভারসেশন লিস্ট আনা
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.error("Fetch Conversations Error:", err); }
  }, [getAccessTokenSilently]);

  // চ্যাট ওপেন করলে আগের মেসেজগুলো লোড করা
  const fetchMessages = async (chatId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/message/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) { console.error("Fetch Messages Error:", err); }
  };

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (currentChat) fetchMessages(currentChat._id);
  }, [currentChat]);

  /* =================✉️ HANDLERS ================= */
  
  const handleSend = async (mediaUrl = null, mediaType = "text") => {
    if (!newMessage.trim() && !mediaUrl) return;
    
    const msgData = {
      senderId: user.sub,
      senderName: user.name,
      senderPic: user.picture,
      text: newMessage,
      media: mediaUrl,
      mediaType: mediaType,
      conversationId: currentChat._id,
      isGroup: currentChat.isGroup || false,
      members: currentChat.members // সকেটে পাঠানোর জন্য দরকার
    };

    // ১. লোকাল স্টেট আপডেট (তাত্ক্ষণিক দেখানোর জন্য)
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");

    // ২. সকেটের মাধ্যমে রিয়েল-টাইম পাঠানো
    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", msgData);

    // ৩. ডাটাবেসে পারমানেন্টলি সেভ করা
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConversations(); // লিস্ট আপডেট
    } catch (err) { console.error("Message Save Failed:", err); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_preset"); // আপনার ক্লাউডিনারি প্রিসেট নাম দিন

    try {
      // ক্লাউডিনারি আপলোড
      const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud/upload", formData);
      const type = file.type.startsWith("image") ? "image" : "video";
      handleSend(res.data.secure_url, type);
    } catch (err) { alert("Media transmission failed"); }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden z-[99999]">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />

      {/* --- SIDEBAR / LIST VIEW --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-6 flex justify-between items-center bg-black/20 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <img src={user?.picture} className="w-11 h-11 rounded-full border-2 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]" alt="me" />
            <h1 className="text-2xl font-black italic text-cyan-500 tracking-tighter">ONYX<span className="text-white">DRIFT</span></h1>
          </div>
          <button className="p-3 bg-zinc-900 rounded-2xl border border-white/5"><HiPlus size={24}/></button>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
          <div className="px-6 my-4">
            <div className="bg-[#111] rounded-2xl py-3.5 px-5 flex items-center gap-3 border border-white/5">
                <HiMagnifyingGlass className="text-zinc-600" />
                <input type="text" placeholder="Search neural links..." className="bg-transparent outline-none w-full text-sm" />
            </div>
          </div>

          <div className="px-4 space-y-2">
            {conversations.map(c => (
              <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 hover:bg-zinc-900/40 rounded-[2rem] transition-all cursor-pointer border border-transparent hover:border-white/5">
                  <div className="relative">
                    {c.isGroup ? (
                      <div className="w-14 h-14 rounded-[1.4rem] bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400"><HiUserGroup size={28} /></div>
                    ) : (
                      <img src={c.userDetails?.avatar || "https://api.dicebear.com/7.x/avataaars/svg"} className="w-14 h-14 rounded-[1.4rem] object-cover" alt="" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-[16px]">{c.isGroup ? c.groupName : c.userDetails?.name}</span>
                        <span className="text-[10px] text-cyan-500 font-black">STABLE</span>
                    </div>
                    <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage || "Encrypted tunnel active"}</p>
                  </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- BOTTOM DOCK --- */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-[#111]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[100]">
           <button onClick={() => setActiveTab("chats")} className={`p-4 rounded-full ${activeTab === "chats" ? 'text-cyan-500 bg-cyan-500/10' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
           <button onClick={() => setActiveTab("groups")} className={`p-4 ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiUsers size={28} /></button>
           <button onClick={() => setActiveTab("settings")} className={`p-4 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      {/* --- MAIN CHAT WINDOW --- */}
      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 bg-[#050505] z-[200] flex flex-col">
           <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={30}/></button>
                 <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-white/10">
                    {currentChat.isGroup ? <HiUserGroup size={24} className="m-2 text-cyan-500" /> : <img src={currentChat.userDetails?.avatar} className="w-full h-full object-cover" alt="" />}
                 </div>
                 <h3 className="text-[15px] font-bold">{currentChat.isGroup ? currentChat.groupName : currentChat.userDetails?.name}</h3>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setShowGroupCall(true)} className="p-3 text-cyan-500 bg-cyan-500/10 rounded-2xl"><HiOutlineVideoCamera size={24}/></button>
                 <button className="p-3 text-zinc-400"><HiOutlinePhone size={24}/></button>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  {currentChat.isGroup && m.senderId !== user?.sub && <span className="text-[10px] text-zinc-500 ml-2 mb-1">{m.senderName}</span>}
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] ${m.senderId === user?.sub ? 'bg-cyan-600 text-white rounded-tr-none shadow-[0_5px_15px_rgba(6,182,212,0.2)]' : 'bg-zinc-900 text-zinc-100 rounded-tl-none'}`}>
                    {m.mediaType === "image" && <img src={m.media} className="rounded-2xl mb-2 max-w-full border border-white/10" alt="media" />}
                    {m.mediaType === "video" && <video src={m.media} controls className="rounded-2xl mb-2 max-w-full border border-white/10" />}
                    {m.text && <p className="leading-relaxed">{m.text}</p>}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
           </div>

           <div className="p-4 pb-10 bg-black/60 border-t border-white/5 backdrop-blur-xl flex items-center gap-3">
              <button onClick={() => fileInputRef.current.click()} className="p-3 text-zinc-500 hover:text-cyan-400 transition-colors"><HiOutlinePhoto size={28}/></button>
              <div className="flex-1 flex items-center gap-3 bg-[#111] p-2 rounded-[2.5rem] border border-white/10 focus-within:border-cyan-500/50 transition-all">
                 <input 
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Transmit encrypted signal..." 
                    className="bg-transparent flex-1 px-4 outline-none text-sm text-white" 
                 />
                 <button onClick={() => handleSend()} className="p-3.5 bg-cyan-500 text-black rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-90 transition-all">
                    <HiOutlinePaperAirplane size={22} className="-rotate-45" />
                 </button>
              </div>
           </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* --- OVERLAYS --- */}
      <CallOverlay incomingCall={incomingCall} setIncomingCall={setIncomingCall} ringtoneRef={ringtoneRef} navigate={navigate} />
      
      <AnimatePresence>
        {showGroupCall && (
          <GroupCallScreen 
            roomId={currentChat?._id} 
            participants={currentChat?.members} 
            onHangup={() => setShowGroupCall(false)} 
          />
        )}
      </AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default Messenger;