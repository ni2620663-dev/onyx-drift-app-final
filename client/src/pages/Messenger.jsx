import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaPaperPlane, FaUserCircle, FaVideo, FaPhoneAlt, FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Messenger = () => {
  const { user } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null); // কল রিসিভ করার জন্য
  const [searchTerm, setSearchTerm] = useState(""); // ইউজার খোঁজার জন্য
  
  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  // ১. সকেট কানেকশন ও লিসেনার
  useEffect(() => {
    socket.current = io("http://localhost:10000");

    socket.current.on("getMessage", (data) => {
      setArrivalMessage({
        senderId: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });

    socket.current.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // ভিডিও কল আসলে মডাল দেখাবে
    socket.current.on("incomingCall", (data) => {
      setIncomingCall(data);
    });

    return () => socket.current.disconnect();
  }, []);

  // ২. নতুন মেসেজ হ্যান্ডলিং
  useEffect(() => {
    if (arrivalMessage && currentChat?.members.includes(arrivalMessage.senderId)) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  // ৩. অনলাইন স্ট্যাটাস আপডেট
  useEffect(() => {
    if (user?.sub) {
      socket.current.emit("addNewUser", user.sub);
    }
  }, [user]);

  // ৪. কনভারসেশন লিস্ট লোড করা
  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    if (user?.sub) getConversations();
  }, [user?.sub, API_URL]);

  // ৫. মেসেজ হিস্টোরি লোড করা
  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat?._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    if (currentChat) getMessages();
  }, [currentChat, API_URL]);

  // ৬. ভিডিও কল শুরু করা
  const handleVideoCall = () => {
    if (!currentChat || !user) return;
    const roomId = currentChat._id;
    const receiverId = currentChat.members.find(m => m !== user.sub);

    socket.current.emit("sendCallInvite", {
      senderName: user.name || "A User",
      roomId: roomId,
      receiverId: receiverId
    });

    navigate(`/call/${roomId}`);
  };

  // ৭. মেসেজ পাঠানো
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    const receiverId = currentChat.members.find((member) => member !== user.sub);
    const messageObj = {
      senderId: user.sub,
      text: newMessage,
      conversationId: currentChat._id,
    };

    socket.current.emit("sendMessage", {
      senderId: user.sub,
      receiverId,
      text: newMessage,
    });

    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageObj);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ৮. নতুন চ্যাট শুরু করা (ইউজার আইডি দিয়ে টেস্ট করার জন্য)
  const handleStartChat = async () => {
    if (!searchTerm) return;
    try {
      const res = await axios.post(`${API_URL}/api/messages/conversation`, {
        senderId: user.sub,
        receiverId: searchTerm // এখানে ইউজারের Auth0 ID দিতে হবে
      });
      setConversations([...conversations, res.data]);
      setSearchTerm("");
    } catch (err) {
      console.log("Conversation already exists or error", err);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isOnline = (members) => {
    const otherMemberId = members.find(m => m !== user?.sub);
    return onlineUsers.some((u) => u.userId === otherMemberId);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
      
      {/* ইনকামিং কল মডাল */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-bounce">
            <FaVideo size={50} className="mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-bold dark:text-white mb-2">{incomingCall.senderName}</h2>
            <p className="text-gray-500 mb-6">Incoming Video Call...</p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate(`/call/${incomingCall.roomId}`)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition"
              > Accept </button>
              <button 
                onClick={() => setIncomingCall(null)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition"
              > Reject </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: চ্যাট লিস্ট */}
      <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white mb-4">Messages</h2>
          {/* চ্যাট শুরু করার ইনপুট */}
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter User ID..." 
              value={searchTerm}
              onChange={(e)=>setSearchTerm(e.target.value)}
              className="flex-1 text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none dark:text-white"
            />
            <button onClick={handleStartChat} className="p-2 bg-blue-600 text-white rounded-lg"><FaSearch size={14}/></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <div 
                key={c._id}
                onClick={() => setCurrentChat(c)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition ${currentChat?._id === c._id ? 'bg-blue-50 dark:bg-gray-700 border-r-4 border-blue-500' : ''}`}
              >
                <div className="relative">
                  <FaUserCircle className="text-4xl text-gray-400" />
                  {isOnline(c.members) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="text-sm font-semibold dark:text-white truncate">
                  Chat Room
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              No conversations yet. Use search to start one!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!currentChat ? 'hidden md:flex' : 'flex'}`}>
        {currentChat ? (
          <>
            <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FaUserCircle className="text-3xl text-blue-500" />
                <span className="font-bold dark:text-white">Active Chat</span>
              </div>
              <div className="flex gap-4">
                <button onClick={handleVideoCall} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition">
                  <FaVideo size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, index) => (
                <div key={index} ref={scrollRef} className={`flex ${m.senderId === user.sub ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-3 px-4 rounded-2xl shadow-sm ${m.senderId === user.sub ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-gray-700 dark:text-white rounded-bl-none"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 p-3 px-6 text-white rounded-xl hover:bg-blue-700 transition font-bold flex items-center gap-2">
                <FaPaperPlane /> <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900">
             <FaUserCircle size={80} className="mb-4 opacity-20" />
             <p className="text-xl font-medium">Select a friend to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;