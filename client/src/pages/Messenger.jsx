import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  HiMagnifyingGlass, HiPlus, HiChatBubbleLeftRight, 
  HiUsers, HiCog6Tooth, HiOutlineChevronLeft, 
  HiOutlinePhone, HiOutlineVideoCamera,
  HiOutlinePaperAirplane, HiUserGroup, 
  HiOutlinePhoto, HiXMark, HiCheck
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";

// কম্পোনেন্ট ইমপোর্ট
import CallOverlay from "../components/Messenger/CallOverlay";
import GroupCallScreen from "../components/GroupCallScreen";

const Messenger = ({ socket }) => {
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // --- STATES ---
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [incomingCall, setIncomingCall] = useState(null);
  
  // Group Create States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // ডাটাবেসের সব ইউজার
  const [selectedUsers, setSelectedUsers] = useState([]); // গ্রুপে যাদের অ্যাড করবেন
  const [groupName, setGroupName] = useState("");

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  /* =================📡 SOCKET LOGIC ================= */
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

    s.on("incomingCall", (data) => {
        setIncomingCall(data);
        ringtoneRef.current.play().catch(() => {});
    });

    return () => {
      s.off("getMessage");
      s.off("incomingCall");
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =================📦 DATA FETCHING ================= */
  
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) { console.error(err); }
  }, [getAccessTokenSilently]);

  // সব ইউজারদের লিস্ট আনা (গ্রুপে অ্যাড করার জন্য)
  const fetchAllUsers = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(res.data.filter(u => u.sub !== user.sub)); // নিজেকে বাদে বাকিরা
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchConversations();
        fetchAllUsers();
    }
  }, [isAuthenticated, fetchConversations]);

  const fetchMessages = async (chatId) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/message/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (currentChat) fetchMessages(currentChat._id);
  }, [currentChat]);

  /* =================✉️ HANDLERS ================= */
  
  // ১. গ্রুপ তৈরি করা
  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length < 1) return alert("Enter name and select users");
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.post(`${API_URL}/api/messages/group`, {
        name: groupName,
        members: [...selectedUsers, user.sub] // সিলেক্ট করা ইউজার + আপনি নিজে
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsGroupModalOpen(false);
      setGroupName("");
      setSelectedUsers([]);
      fetchConversations();
      alert("Neural Group Synced!");
    } catch (err) { alert("Group creation failed"); }
  };

  // ২. কল করা (Private & Group)
  const initiateCall = (type) => {
    const s = socket?.current || socket;
    const roomId = `room-${Date.now()}`;
    const callData = {
        senderId: user.sub,
        senderName: user.name,
        receiverId: currentChat.isGroup ? null : currentChat.userDetails.id,
        members: currentChat.members, // গ্রুপের ক্ষেত্রে কাজে লাগবে
        roomId: roomId,
        type: type,
        isGroup: currentChat.isGroup
    };
    if (s) s.emit(currentChat.isGroup ? "startGroupCall" : "callUser", callData);
    navigate(`/call/${roomId}?type=${type}`);
  };

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
      members: currentChat.members 
    };
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
    const s = socket?.current || socket;
    if (s) s.emit("sendMessage", msgData);
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/messages/message`, msgData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden z-[99999]">
      <input type="file" ref={fileInputRef} onChange={(e) => {/* Cloudinary logic here */}} className="hidden" />

      {/* --- SIDEBAR --- */}
      <div className={`flex flex-col h-full w-full ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-6 flex justify-between items-center bg-black/20 border-b border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <img src={user?.picture} className="w-11 h-11 rounded-full border-2 border-cyan-500/30" alt="me" />
            <h1 className="text-2xl font-black italic text-cyan-500">ONYXDRIFT</h1>
          </div>
          <button onClick={() => setIsGroupModalOpen(true)} className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-cyan-500">
            <HiPlus size={24}/>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 no-scrollbar px-4 space-y-2 mt-4">
          {conversations.map(c => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className="p-4 flex items-center gap-4 hover:bg-zinc-900/40 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-white/5">
                <div className="relative">
                  {c.isGroup ? (
                    <div className="w-14 h-14 rounded-[1.4rem] bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400"><HiUserGroup size={28} /></div>
                  ) : (
                    <img src={c.userDetails?.avatar} className="w-14 h-14 rounded-[1.4rem] object-cover" alt="" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                      <span className="font-bold">{c.isGroup ? c.groupName : c.userDetails?.name}</span>
                      <span className="text-[10px] text-cyan-500 font-black">STABLE</span>
                  </div>
                  <p className="text-[12px] text-zinc-500 truncate">{c.lastMessage || "Signal established..."}</p>
                </div>
            </div>
          ))}
        </div>

        {/* BOTTOM DOCK */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-[#111]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex justify-around items-center z-[100]">
           <button onClick={() => setActiveTab("chats")} className={`p-4 ${activeTab === "chats" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiChatBubbleLeftRight size={28} /></button>
           <button onClick={() => setActiveTab("groups")} className={`p-4 ${activeTab === "groups" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiUsers size={28} /></button>
           <button onClick={() => setActiveTab("settings")} className={`p-4 ${activeTab === "settings" ? 'text-cyan-500' : 'text-zinc-600'}`}><HiCog6Tooth size={28} /></button>
        </div>
      </div>

      {/* --- CREATE GROUP MODAL --- */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-cyan-500">New Neural Group</h2>
                    <button onClick={() => setIsGroupModalOpen(false)}><HiXMark size={28}/></button>
                </div>
                <input 
                    placeholder="Group Identity Name..." 
                    className="w-full bg-zinc-900 p-4 rounded-2xl outline-none border border-white/5 mb-4"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                />
                <p className="text-xs text-zinc-500 mb-2 ml-2 uppercase tracking-widest">Select Drifters</p>
                <div className="h-60 overflow-y-auto space-y-2 no-scrollbar mb-6">
                    {allUsers.map(u => (
                        <div 
                            key={u.sub} 
                            onClick={() => selectedUsers.includes(u.sub) ? setSelectedUsers(selectedUsers.filter(id => id !== u.sub)) : setSelectedUsers([...selectedUsers, u.sub])}
                            className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${selectedUsers.includes(u.sub) ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-zinc-900/50 border-transparent'} border`}
                        >
                            <div className="flex items-center gap-3">
                                <img src={u.picture} className="w-10 h-10 rounded-full" />
                                <span className="text-sm">{u.name}</span>
                            </div>
                            {selectedUsers.includes(u.sub) && <HiCheck className="text-cyan-500" />}
                        </div>
                    ))}
                </div>
                <button onClick={handleCreateGroup} className="w-full py-4 bg-cyan-500 text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">INITIALIZE GROUP</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHAT WINDOW (Call Icons Added) --- */}
      <AnimatePresence>
      {currentChat && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 bg-[#050505] z-[200] flex flex-col">
           <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/60 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                 <button onClick={() => setCurrentChat(null)} className="text-zinc-400 p-2"><HiOutlineChevronLeft size={30}/></button>
                 <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-white/10">
                    {currentChat.isGroup ? <HiUserGroup size={24} className="m-2 text-cyan-500" /> : <img src={currentChat.userDetails?.avatar} className="w-full h-full object-cover" />}
                 </div>
                 <h3 className="text-[15px] font-bold">{currentChat.isGroup ? currentChat.groupName : currentChat.userDetails?.name}</h3>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => initiateCall('video')} className="p-3 text-cyan-500 bg-cyan-500/10 rounded-2xl"><HiOutlineVideoCamera size={24}/></button>
                 <button onClick={() => initiateCall('audio')} className="p-3 text-zinc-400"><HiOutlinePhone size={24}/></button>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user?.sub ? 'items-end' : 'items-start'}`}>
                  {currentChat.isGroup && m.senderId !== user?.sub && <span className="text-[10px] text-zinc-500 ml-2 mb-1">{m.senderName}</span>}
                  <div className={`px-5 py-3 rounded-[1.8rem] max-w-[85%] ${m.senderId === user?.sub ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-100 rounded-tl-none'}`}>
                    {m.text && <p className="text-sm">{m.text}</p>}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
           </div>

           <div className="p-4 pb-10 bg-black/60 border-t border-white/5 flex items-center gap-3">
              <button className="p-3 text-zinc-500"><HiOutlinePhoto size={28}/></button>
              <div className="flex-1 flex items-center gap-3 bg-[#111] p-2 rounded-[2.5rem] border border-white/10">
                 <input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Transmit message..." 
                    className="bg-transparent flex-1 px-4 outline-none text-sm text-white" 
                 />
                 <button onClick={() => handleSend()} className="p-3.5 bg-cyan-500 text-black rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <HiOutlinePaperAirplane size={22} className="-rotate-45" />
                 </button>
              </div>
           </div>
        </motion.div>
      )}
      </AnimatePresence>

      <CallOverlay incomingCall={incomingCall} setIncomingCall={setIncomingCall} ringtoneRef={ringtoneRef} navigate={navigate} />
    </div>
  );
};

export default Messenger;