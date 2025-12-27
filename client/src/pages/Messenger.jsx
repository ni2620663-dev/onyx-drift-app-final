import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaVideo, FaPhoneAlt } from "react-icons/fa";
const Messenger = () => {
  const { user } = useAuth0();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const socket = useRef();
  const scrollRef = useRef();
  const API_URL = import.meta.env.VITE_API_URL;
  nst navigate = useNavigate();

const handleVideoCall = () => {
  // কনভারসেশন আইডি রুম আইডি হিসেবে ব্যবহার হবে
  navigate(`/call/${currentChat._id}`);
};

// UI এর হেডার অংশে বাটনটি যোগ করুন
// কম্পোনেন্টের ভেতরে স্টেট হিসেবে যোগ করুন
const [onlineUsers, setOnlineUsers] = useState([]);

// Socket এর useEffect এর ভেতরে এটি যোগ করুন
useEffect(() => {
  socket.current.on("getOnlineUsers", (users) => {
    setOnlineUsers(users);
  });
}, []);

// ইউজার অনলাইন কি না তা চেক করার জন্য একটি হেল্পার ফাংশন
const isOnline = (memberId) => {
  return onlineUsers.some((u) => u.userId === memberId);
};
<div className="flex gap-4">
  <button onClick={handleVideoCall} className="p-2 text-blue-500 hover:bg-gray-100 rounded-full transition">
    <FaVideo size={20} />
  </button>
  <button className="p-2 text-green-500 hover:bg-gray-100 rounded-full transition">
    <FaPhoneAlt size={18} />
  </button>
</div>

// UI এর ভেতরে প্রোফাইল পিকচারের সাথে এই লজিকটি বসান:
{/* চ্যাট লিস্টের প্রোফাইল পিকচার সেকশন */}
<div className="relative">
  <FaUserCircle className="text-3xl text-gray-400" />
  {isOnline(otherUserId) && (
    <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
  )}
</div>
  // ১. Socket Connection ও Real-time Message রিসিভ
  useEffect(() => {
    socket.current = io("ws://localhost:5000"); // আপনার ব্যাকএন্ড পোর্ট
    socket.current.on("getMessage", (data) => {
      setArrivalMessage({
        senderId: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });
  }, []);

  useEffect(() => {
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.senderId) &&
      setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    socket.current.emit("addNewUser", user?.sub);
  }, [user]);

  // ২. কনভারসেশন লিস্ট নিয়ে আসা
  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`);
        setConversations(res.data);
      } catch (err) { console.log(err); }
    };
    getConversations();
  }, [user?.sub]);

  // ৩. মেসেজ হিস্টোরি নিয়ে আসা
  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/message/${currentChat?._id}`);
        setMessages(res.data);
      } catch (err) { console.log(err); }
    };
    if (currentChat) getMessages();
  }, [currentChat]);

  // ৪. মেসেজ পাঠানো
  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = {
      senderId: user.sub,
      text: newMessage,
      conversationId: currentChat._id,
    };
    const handleVideoCall = () => {
  const roomId = currentChat._id;
  const receiverId = currentChat.members.find(m => m !== user.sub);

  // ১. সকেটের মাধ্যমে অপর ইউজারকে কল সিগন্যাল পাঠানো
  socket.current.emit("sendCallInvite", {
    senderName: user.name,
    roomId: roomId,
    receiverId: receiverId
  });

  // ২. নিজে কল রুমে চলে যাওয়া
  navigate(`/call/${roomId}`);
};

    const receiverId = currentChat.members.find((member) => member !== user.sub);

    socket.current.emit("sendMessage", {
      senderId: user.sub,
      receiverId,
      text: newMessage,
    });

    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, message);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* বাম পাশ: চ্যাট লিস্ট */}
      <div className="w-1/4 bg-white dark:bg-gray-800 border-r dark:border-gray-700 hidden md:block">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Messages</h2>
        </div>
        <div className="overflow-y-auto h-full">
          {conversations.map((c) => (
            <div 
              key={c._id}
              onClick={() => setCurrentChat(c)}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition ${currentChat?._id === c._id ? 'bg-blue-50 dark:bg-gray-700 border-r-4 border-blue-500' : ''}`}
            >
              <FaUserCircle className="text-3xl text-gray-400" />
              <div className="text-sm font-semibold dark:text-white">Chat Room</div>
            </div>
          ))}
        </div>
      </div>

      {/* ডান পাশ: মেইন চ্যাট উইন্ডো */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center gap-3">
              <FaUserCircle className="text-2xl text-blue-500" />
              <span className="font-bold dark:text-white">Chat with User</span>
            </div>

            {/* Message Display Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => (
                <div key={m._id} ref={scrollRef} className={`flex ${m.senderId === user.sub ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 px-4 rounded-2xl shadow-sm ${m.senderId === user.sub ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-gray-700 dark:text-white rounded-bl-none"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 p-3 px-6 text-white rounded-xl hover:bg-blue-700 transition font-bold flex items-center gap-2">
                <FaPaperPlane /> <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xl font-medium">
            Open a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;