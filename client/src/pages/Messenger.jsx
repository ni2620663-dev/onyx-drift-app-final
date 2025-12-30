import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { 
  FaPaperPlane, FaUserCircle, FaVideo, FaSearch, 
  FaPhone, FaInfoCircle, FaImage, FaSmile, 
  FaChevronLeft, FaFacebookMessenger 
} from "react-icons/fa"; // সব আইকন এখানে ইমপোর্ট করা হয়েছে
import { useNavigate } from "react-router-dom";

const Messenger = () => {
  const { user, logout } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();
  const ringtone = useRef(new Audio("/sounds/ringtone.mp3"));

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  // ১. সকেট কানেকশন ও লিসেনার
  useEffect(() => {
    socket.current = io(API_URL);
    socket.current.on("getMessage", (data) => {
      setArrivalMessage({ senderId: data.senderId, text: data.text, createdAt: Date.now() });
    });
    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));
    socket.current.on("incomingCall", (data) => {
      setIncomingCall(data);
      ringtone.current.loop = true;
      ringtone.current.play().catch(e => console.log("Audio play blocked"));
    });
    return () => {
      socket.current.disconnect();
      ringtone.current.pause();
    };
  }, [API_URL]);

  useEffect(() => {
    if (arrivalMessage && currentChat?.members.includes(arrivalMessage.senderId)) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    if (user?.sub) socket.current.emit("addNewUser", user.sub);
  }, [user]);

  // ২. কনভারসেশন ও মেসেজ লোড
  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data);
      } catch (err) { console.error(err); }
    };
    if (user?.sub) getConversations();
  }, [user?.sub, API_URL]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat?._id}`);
        setMessages(res.data);
      } catch (err) { console.error(err); }
    };
    if (currentChat) getMessages();
  }, [currentChat, API_URL]);

  // ৩. কল ও মেসেজ হ্যান্ডলিং
  const handleVideoCall = () => {
    if (!currentChat || !user) return;
    const roomId = currentChat._id;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    socket.current.emit("sendCallInvite", { senderName: user.name || "User", roomId, receiverId });
    navigate(`/call/${roomId}`);
  };

  const acceptCall = () => { ringtone.current.pause(); navigate(`/call/${incomingCall.roomId}`); setIncomingCall(null); };
  const rejectCall = () => { ringtone.current.pause(); setIncomingCall(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;
    const receiverId = currentChat.members.find((member) => member !== user.sub);
    const messageObj = { senderId: user.sub, text: newMessage, conversationId: currentChat._id };
    socket.current.emit("sendMessage", { senderId: user.sub, receiverId, text: newMessage });
    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageObj);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  const handleStartChat = async () => {
    if (!searchTerm) return;
    try {
      const res = await axios.post(`${API_URL}/api/messages/conversation`, { senderId: user.sub, receiverId: searchTerm });
      if (!conversations.find(c => c._id === res.data._id)) setConversations([...conversations, res.data]);
      setCurrentChat(res.data);
      setSearchTerm("");
    } catch (err) { console.log("Error", err); }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const isOnline = (members) => {
    const otherMemberId = members.find(m => m !== user?.sub);
    return onlineUsers.some((u) => u.userId === otherMemberId);
  };

  return (
    <div className="flex h-[calc(100vh-110px)] bg-[#18191a] text-gray-200 overflow-hidden font-sans">
      
      {/* ইনকামিং কল উইন্ডো */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#242526] p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-gray-700">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FaVideo size={35} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{incomingCall.senderName}</h2>
            <p className="text-gray-400 mb-8 font-medium italic">Incoming video call...</p>
            <div className="flex gap-4">
              <button onClick={acceptCall} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition shadow-lg">Accept</button>
              <button onClick={rejectCall} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* বাম পাশ: চ্যাট লিস্ট */}
      <div className={`w-full md:w-[360px] border-r border-gray-700 flex flex-col bg-[#18191a] ${currentChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4">
          <h2 className="text-2xl font-black mb-4 text-white">Chats</h2>
          <div className="flex gap-2 bg-[#3a3b3c] rounded-full px-4 py-2.5 items-center border border-transparent focus-within:border-gray-500 transition">
            <FaSearch className="text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by Auth0 ID" 
              value={searchTerm}
              onChange={(e)=>setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <div 
                key={c._id}
                onClick={() => setCurrentChat(c)}
                className={`p-3 mx-2 rounded-xl flex items-center gap-3 cursor-pointer transition mb-1 ${currentChat?._id === c._id ? 'bg-[#3a3b3c]' : 'hover:bg-[#242526]'}`}
              >
                <div className="relative">
                  <FaUserCircle className="text-5xl text-gray-500" />
                  {isOnline(c.members) && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#18191a] rounded-full shadow-md"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] text-white truncate">Room ID: {c._id.slice(-6)}</div>
                  <p className="text-xs text-gray-500 truncate">Click to open messages</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-sm mt-10 italic">No conversations found</p>
          )}
        </div>
      </div>

      {/* ডান পাশ: মেইন চ্যাট এরিয়া */}
      <div className={`flex-1 flex flex-col bg-[#18191a] ${!currentChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {currentChat ? (
          <>
            {/* চ্যাট হেডার */}
            <div className="p-3 bg-[#242526] border-b border-gray-700 flex justify-between items-center px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <FaChevronLeft className="md:hidden cursor-pointer text-gray-400" onClick={() => setCurrentChat(null)} />
                <div className="relative">
                  <FaUserCircle className="text-4xl text-blue-500" />
                  {isOnline(currentChat.members) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[#242526] rounded-full"></div>}
                </div>
                <div>
                  <h3 className="font-bold text-white text-[15px]">Active Conversation</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online Now</p>
                </div>
              </div>
              <div className="flex gap-6 text-blue-500 items-center">
                <FaPhone className="cursor-pointer hover:scale-110 transition" size={18} />
                <FaVideo className="cursor-pointer hover:scale-110 transition" size={20} onClick={handleVideoCall} />
                <FaInfoCircle className="cursor-pointer hover:scale-110 transition" size={18} />
              </div>
            </div>

            {/* মেসেজ লিস্ট */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((m, index) => (
                <div key={index} className={`flex ${m.senderId === user.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[14px] shadow-sm leading-relaxed ${
                    m.senderId === user.sub 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-[#3a3b3c] text-white rounded-bl-sm border border-gray-700'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* চ্যাট ইনপুট */}
            <div className="p-4 bg-[#18191a] border-t border-gray-800">
              <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
                <FaImage className="text-blue-500 cursor-pointer hover:text-blue-400" size={20} />
                <div className="flex-1 bg-[#3a3b3c] px-4 py-2.5 rounded-full flex items-center shadow-inner">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Aa"
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                  />
                  <FaSmile className="text-blue-500 cursor-pointer" size={20} />
                </div>
                <button type="submit" disabled={!newMessage.trim()} className="text-blue-500 disabled:opacity-20 hover:scale-110 transition">
                  <FaPaperPlane size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center animate-in fade-in duration-700">
             <div className="w-24 h-24 bg-[#242526] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-xl">
                <FaFacebookMessenger size={50} className="text-gray-700" />
             </div>
             <h3 className="text-xl font-bold text-gray-300">Select a Chat</h3>
             <p className="text-gray-500 text-sm max-w-[250px] mx-auto mt-2">Choose a person from the left or search to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;