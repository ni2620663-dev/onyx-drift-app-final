import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiOutlineChevronLeft, HiPlus, HiXMark, HiMagnifyingGlass,
  HiOutlineInformationCircle, HiOutlinePhoto, HiOutlineMicrophone
} from "react-icons/hi2";

const Messenger = ({ socket }) => { 
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]); 
  const [isTyping, setIsTyping] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const ringtoneRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"));
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  /* =================📡 SOCKET LOGIC ================= */
  useEffect(() => {
    const s = socket?.current || socket;
    if (!s || !user?.sub) return;

    s.emit("addNewUser", user.sub);

    const handleMessage = (data) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(m => (m.tempId && m.tempId === data.tempId) || (m._id && m._id === data._id));
        if (isDuplicate) return prev;
        return [...prev, data];
      });
    };

    const handleTyping = (data) => {
      if (currentChat?.members?.includes(data.senderId)) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(e => console.log("Audio play blocked"));
    };

    s.on("getMessage", handleMessage);
    s.on("displayTyping", handleTyping);
    s.on("incomingCall", handleIncomingCall);

    return () => {
      s.off("getMessage", handleMessage);
      s.off("displayTyping", handleTyping);
      s.off("incomingCall", handleIncomingCall);
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* =================✉️ HANDLERS ================= */
  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const s = socket?.current || socket;
    const tempId = `temp_${Date.now()}`;

    const msgData = {
      tempId, senderId: user.sub, receiverId, text: newMessage,
      conversationId: currentChat._id, createdAt: new Date().toISOString()
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

  const handleCall = (type) => {
    const s = socket?.current || socket;
    if (!currentChat || !s) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const roomId = `onyx_${Date.now()}`;
    s.emit("sendCallRequest", { senderId: user.sub, senderName: user.name, receiverId, roomId, type });
    navigate(`/call/${roomId}`);
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
  }, [getAccessTokenSilently, API_URL]);

  useEffect(() => { if (isAuthenticated) fetchConversations(); }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [currentChat, getAccessTokenSilently, API_URL]);

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden fixed inset-0 font-sans">
      
      {/* --- SIDEBAR (Chat List) --- */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] border-r border-gray-200 flex flex-col bg-white`}>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><HiOutlineVideoCamera size={20}/></button>
              <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><HiPlus size={20}/></button>
            </div>
          </div>
          
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" placeholder="Search Messenger" 
              className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 outline-none text-sm focus:bg-white border border-transparent focus:border-gray-200"
              onChange={(e) => {setSearchQuery(e.target.value)}}
            />
          </div>

          {/* Stories Section (Messenger Style) */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer">
                <HiPlus className="text-gray-500" />
              </div>
              <span className="text-[10px] text-gray-500">Your Story</span>
            </div>
            {/* Mock Stories */}
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-14 h-14 rounded-full border-2 border-blue-500 p-0.5 cursor-pointer">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-full h-full rounded-full object-cover" alt=""/>
                </div>
                <span className="text-[10px] text-gray-700">User_{i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className={`mx-2 px-3 py-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${currentChat?._id === c._id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${c._id}`} alt=""/>
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                   <span className="text-sm font-semibold">Node_{c._id.slice(-4)}</span>
                   <span className="text-[11px] text-gray-500">4:20 PM</span>
                </div>
                <p className="text-[12px] text-gray-500 truncate">Sent a message</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col bg-white relative`}>
        {currentChat ? (
          <>
            {/* Chat Header */}
            <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 shadow-sm z-20 bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentChat(null)} className="md:hidden text-blue-600"><HiOutlineChevronLeft size={24} /></button>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                   <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentChat._id}`} alt=""/>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold leading-none">Messenger Node_{currentChat._id.slice(-4)}</h3>
                  <span className="text-[11px] text-green-500 font-medium">Active now</span>
                </div>
              </div>
              <div className="flex gap-4 text-blue-600">
                <button onClick={() => handleCall('voice')} className="hover:bg-gray-100 p-2 rounded-full"><HiOutlinePhone size={22} /></button>
                <button onClick={() => handleCall('video')} className="hover:bg-gray-100 p-2 rounded-full"><HiOutlineVideoCamera size={22} /></button>
                <button className="hover:bg-gray-100 p-2 rounded-full"><HiOutlineInformationCircle size={22} /></button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white">
              <div className="flex flex-col items-center py-10 space-y-2">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentChat._id}`} className="rounded-full" alt=""/>
                </div>
                <h2 className="font-bold text-lg">Messenger Node</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">You're connected on Onyx Messenger</p>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-[15px] ${
                    m.senderId === user?.sub 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-black rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-gray-400 italic">Someone is typing...</div>}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 flex items-center gap-3 bg-white border-t border-gray-100">
              <button className="text-blue-600"><HiPlus size={24}/></button>
              <button className="text-blue-600"><HiOutlinePhoto size={24}/></button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                <input 
                  value={newMessage} 
                  onChange={(e) => {setNewMessage(e.target.value)}} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Aa" 
                  className="bg-transparent flex-1 outline-none text-sm" 
                />
                <span className="text-blue-600 text-lg cursor-pointer">😊</span>
              </div>
              {newMessage.trim() ? (
                <button onClick={handleSend} className="text-blue-600"><HiOutlinePaperAirplane size={24}/></button>
              ) : (
                <button className="text-blue-600"><HiOutlineMicrophone size={24}/></button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <HiOutlinePhone size={40}/>
            </div>
            <p className="text-sm font-medium">Select a chat to start messaging</p>
          </div>
        )}
      </div>

      {/* --- INCOMING CALL UI --- */}
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
            <div className="w-24 h-24 rounded-full bg-blue-500 mb-6 animate-pulse p-1">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${incomingCall.senderName}`} className="rounded-full" alt=""/>
            </div>
            <h2 className="text-2xl font-bold">{incomingCall.senderName}</h2>
            <p className="text-gray-400 mt-2">Incoming {incomingCall.type} call...</p>
            <div className="flex gap-10 mt-20">
              <button onClick={() => { ringtoneRef.current.pause(); setIncomingCall(null); }} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"><HiXMark size={30}/></button>
              <button onClick={() => { ringtoneRef.current.pause(); navigate(`/call/${incomingCall.roomId}`); setIncomingCall(null); }} className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center animate-bounce hover:scale-110 transition-transform"><HiOutlinePhone size={30}/></button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Messenger;