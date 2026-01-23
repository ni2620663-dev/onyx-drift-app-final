import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { HiOutlinePaperAirplane, HiOutlineHashtag, HiOutlineUsers } from "react-icons/hi2";

const ChatRoom = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socket = useRef();
  const scrollRef = useRef();

  const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

  useEffect(() => {
    // সকেট কানেকশন
    socket.current = io(API_URL);

    // পুরোনো মেসেজ বা রিয়েল টাইম মেসেজ রিসিভ করা
    socket.current.on("getGlobalMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.current.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;

    const messageData = {
      sender: user?.nickname || "Guest_Drifter",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pic: user?.picture
    };

    // সার্ভারে পাঠানো
    socket.current.emit("sendGlobalMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setText("");
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#030712]/50 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <HiOutlineHashtag className="text-cyan-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Global_Neural_Link</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] text-gray-500 uppercase">Live</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-cyan-500/80 uppercase">{m.sender}</span>
              <span className="text-[7px] text-gray-600">{m.time}</span>
            </div>
            <p className="text-[11px] text-gray-300 bg-white/5 self-start px-3 py-2 rounded-xl border border-white/5">
              {m.text}
            </p>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/20">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="TYPE TO BROADCAST..." 
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-[10px] uppercase tracking-tighter"
          />
          <button 
            onClick={handleSend}
            className="p-3 bg-cyan-500 rounded-xl text-black hover:bg-cyan-400 transition-colors"
          >
            <HiOutlinePaperAirplane size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;