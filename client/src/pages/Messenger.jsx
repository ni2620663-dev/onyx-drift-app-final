import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlinePhone, HiOutlineVideoCamera, HiOutlinePaperAirplane, 
  HiCheck, HiOutlineTrash, HiOutlineChatBubbleBottomCenterText, 
  HiOutlineMicrophone, HiOutlineChevronLeft, HiOutlineStop, 
  HiOutlineEllipsisVertical, HiPlus, HiXMark
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useReactMediaRecorder } from "react-media-recorder";

const Messenger = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // --- Story State ---
  const [selectedStoryFile, setSelectedStoryFile] = useState(null);
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [storyFilter, setStoryFilter] = useState("none");

  const socket = useRef();
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const API_URL = "https://onyx-drift-app-final.onrender.com";

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = 
    useReactMediaRecorder({ audio: true, blobPropertyBag: { type: "audio/wav" } });

  const neonText = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black";

  // --- ১. কল বাটন লজিক ---
  const handleCall = (type) => {
    if (!currentChat) return;
    // একটি ইউনিক রুম আইডি জেনারেট করা হচ্ছে
    const roomId = currentChat._id; 
    navigate(`/call/${roomId}`);
  };

  // --- ২. স্টোরি আপলোড লজিক ---
  const handleStoryUpload = async () => {
    if (!selectedStoryFile) return;
    try {
      setIsStoryUploading(true);
      const token = await getAccessTokenSilently();
      const formData = new FormData();
      formData.append("media", selectedStoryFile);
      formData.append("text", "Neural Link Update");
      formData.append("isStory", "true");
      formData.append("filter", storyFilter);

      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      setSelectedStoryFile(null);
      alert("Story Synced to Nebula!");
    } catch (err) {
      console.error("Story failed", err);
    } finally {
      setIsStoryUploading(false);
    }
  };

  // --- Socket.io Setup (যথাযথ আছে) ---
  useEffect(() => {
    socket.current = io(API_URL, { transports: ["websocket"] });
    socket.current.on("getMessage", (data) => setMessages((prev) => [...prev, data]));
    if (user?.sub) socket.current.emit("addNewUser", user.sub);
    return () => socket.current.disconnect();
  }, [user]);

  // --- Fetch Conversations ---
  const fetchConv = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(`${API_URL}/api/messages/conversation/${user?.sub}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data || []);
    } catch (err) { console.error(err); }
  }, [user?.sub, getAccessTokenSilently]);

  useEffect(() => { if (user?.sub) fetchConv(); }, [user?.sub, fetchConv]);

  // --- Send Logic ---
  const handleSend = async () => {
    if (!newMessage.trim() || !currentChat) return;
    const receiverId = currentChat.members.find(m => m !== user.sub);
    const messageBody = { conversationId: currentChat._id, senderId: user.sub, text: newMessage };
    try {
      const res = await axios.post(`${API_URL}/api/messages/message`, messageBody);
      socket.current.emit("sendMessage", { ...res.data, receiverId });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (currentChat) {
      axios.get(`${API_URL}/api/messages/message/${currentChat._id}`).then(res => setMessages(res.data));
    }
  }, [currentChat]);

  return (
    <div className="flex h-screen bg-[#010409] text-white font-mono overflow-hidden fixed inset-0">
      
      {/* 🚀 STORY EDITOR MODAL (যখন ফাইল সিলেক্ট করা হবে) */}
      <AnimatePresence>
        {selectedStoryFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center p-6">
            <div className="absolute top-6 right-6 flex gap-4">
               <button onClick={() => setSelectedStoryFile(null)} className="p-3 bg-white/10 rounded-full"><HiXMark size={24}/></button>
            </div>
            <div className="w-full max-w-xs aspect-[9/16] bg-zinc-900 rounded-[2rem] overflow-hidden border border-cyan-500/30 relative">
               <img src={URL.createObjectURL(selectedStoryFile)} className="w-full h-full object-cover" style={{ filter: storyFilter === 'neon' ? 'hue-rotate(90deg) saturate(2)' : 'none' }} />
               <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
                  <button onClick={() => setStoryFilter('none')} className={`px-4 py-1 rounded-full text-[10px] border ${storyFilter === 'none' ? 'bg-cyan-500 text-black' : 'border-white/20'}`}>NORMAL</button>
                  <button onClick={() => setStoryFilter('neon')} className={`px-4 py-1 rounded-full text-[10px] border ${storyFilter === 'neon' ? 'bg-cyan-500 text-black' : 'border-white/20'}`}>NEON FX</button>
               </div>
            </div>
            <button onClick={handleStoryUpload} className="mt-8 w-full max-w-xs py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_#06b6d4]">
              {isStoryUploading ? "Transmitting..." : "Post Neural Story"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 Sidebar: Chat List & Stories */}
      <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] bg-[#030712]/60 backdrop-blur-2xl border-r border-white/5 flex flex-col`}>
        <div className="p-8">
          <h2 className={`text-xl tracking-widest uppercase mb-6 ${neonText}`}>Onyx_Nodes</h2>
          
          <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2">
            {/* প্লাস বাটন (স্টোরি অ্যাড করার জন্য) */}
            <label className="flex flex-col items-center gap-2 shrink-0 cursor-pointer">
              <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-cyan-500 hover:border-cyan-500 transition-all">
                <HiPlus size={24} />
              </div>
              <span className="text-[8px] font-black uppercase text-white/40">Add Story</span>
              <input type="file" hidden accept="image/*" onChange={(e) => setSelectedStoryFile(e.target.files[0])} />
            </label>
            
            {/* ডামি স্টোরিজ */}
            {[1, 2, 3].map(i => (
              <div key={i} className="w-14 h-14 rounded-2xl p-[2px] bg-gradient-to-tr from-cyan-500 to-blue-500 shrink-0">
                <div className="bg-black w-full h-full rounded-[14px] p-1">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full rounded-lg object-cover" alt="story" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {conversations.map((c) => (
            <div key={c._id} onClick={() => setCurrentChat(c)} className={`p-5 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all ${currentChat?._id === c._id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/5'}`}>
               <div className="w-11 h-11 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-[10px]">{c._id.slice(-2).toUpperCase()}</div>
               <div className="flex-1">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-white/80">Node_{c._id.slice(-6)}</h4>
                 <p className="text-[8px] text-white/20 uppercase">Link Active</p>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚔️ Main Chat Area */}
      <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col relative`}>
        {currentChat ? (
          <>
            <header className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-[#010409]/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentChat(null)} className="md:hidden text-cyan-400"><HiOutlineChevronLeft size={24} /></button>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Channel: {currentChat._id.slice(-6)}</h3>
              </div>
              <div className="flex gap-5 text-white/40">
                {/* কল বাটনগুলো এখন সচল */}
                <HiOutlinePhone size={20} className="hover:text-cyan-400 cursor-pointer" onClick={() => handleCall('audio')} />
                <HiOutlineVideoCamera size={20} className="hover:text-cyan-400 cursor-pointer" onClick={() => handleCall('video')} />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.sub ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-5 py-3 rounded-2xl border text-[11px] ${m.senderId === user?.sub ? 'bg-cyan-500/10 border-cyan-500/20 rounded-tr-none' : 'bg-white/5 border-white/10 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-full border border-white/10 backdrop-blur-md">
                <HiOutlineMicrophone size={20} className="ml-3 text-gray-500" />
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="TYPE SIGNAL..." className="flex-1 bg-transparent border-none outline-none text-[10px] uppercase tracking-widest" />
                <button onClick={handleSend} className="p-4 bg-cyan-500 rounded-full text-black shadow-lg shadow-cyan-500/20"><HiOutlinePaperAirplane size={18} className="rotate-45" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <HiOutlineChatBubbleBottomCenterText size={80} className="text-cyan-400 mb-4" />
            <p className="text-[10px] font-black tracking-[1em]">IDLE_NODE</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;