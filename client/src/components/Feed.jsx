import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaMicrophone, FaPlus, FaSearch, FaHeart, 
  FaComment, FaShare, FaWaveSquare, FaCheckCircle,
  FaHome, FaRocket, FaUserAlt, FaCog, FaChartLine, FaUserPlus, FaBrain
} from 'react-icons/fa';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

// API Endpoint Logic
const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

const Feed = () => {
  const navigate = useNavigate();
  const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();

  // States
  const [isListening, setIsListening] = useState(false);
  const [activeDrift, setActiveDrift] = useState(null);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [posts, setPosts] = useState([]);

  // ১. ডাটাবেস থেকে পোস্ট নিয়ে আসা (Neural Fetch)
  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error("Neural Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000); // ১০ সেকেন্ড পর পর আপডেট
    return () => clearInterval(interval);
  }, []);

  const handleProfileClick = (targetAuth0Id) => {
    if (targetAuth0Id) navigate(`/following?userId=${targetAuth0Id}`);
  };

  // ২. ভয়েস কমান্ড ফাংশন (The Neural Mic)
  const startVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Neural Voice System not supported.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setIsListening(true);
      setActiveDrift("Listening...");
    };
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      handleNeuralAction(command);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleNeuralAction = async (cmd) => {
    if (cmd.includes("post")) {
      const content = cmd.replace("post", "").trim();
      if (!content) return setActiveDrift("Empty Signal");
      
      try {
        setActiveDrift("Transmitting...");
        const token = await getAccessTokenSilently();
        
        const formData = new FormData();
        formData.append("text", content);
        formData.append("authorName", user?.nickname || user?.name || "Onyx_User");
        formData.append("authorAvatar", user?.picture || "");

        await axios.post(`${API_BASE_URL}/api/posts`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setActiveDrift("Signal Live!");
        setShowPostSuccess(true);
        fetchPosts();
        setTimeout(() => { setActiveDrift(null); setShowPostSuccess(false); }, 3000);
      } catch (e) { setActiveDrift("Sync Failed"); }
    }
  };

  const glassStyle = "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]";

  return (
    <div className="flex w-full h-screen bg-[#050508] text-white overflow-hidden font-sans">
      
      {/* --- ২. বাম সাইডবার (Navigation) --- */}
      <motion.aside
        initial={false}
        animate={{ x: leftOpen ? 0 : (window.innerWidth < 768 ? -320 : 0) }}
        className="fixed md:relative z-[150] w-[260px] h-full bg-[#050508]/95 border-r border-white/5 p-6 flex flex-col shrink-0"
      >
        <div className="mb-10 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-black text-black italic shadow-[0_0_15px_rgba(6,182,212,0.5)]">OX</div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Neural Interface</h2>
        </div>
        
        <nav className="space-y-1">
            {[
                { name: 'Drift Feed', icon: <FaHome />, active: true },
                { name: 'AI Twins', icon: <FaBrain /> },
                { name: 'Neural Stats', icon: <FaChartLine /> },
                { name: 'Profile', icon: <FaUserAlt /> },
                { name: 'Settings', icon: <FaCog /> },
            ].map((item) => (
                <div key={item.name} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${item.active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                    {item.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{item.name}</span>
                </div>
            ))}
        </nav>
      </motion.aside>

      {/* --- ৩. মেইন ফিড (Center) --- */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.05)_0%,_transparent_50%)]">
        
        {/* Mobile Sidebar Toggles */}
        <div className="md:hidden fixed top-1/2 -translate-y-1/2 w-full flex justify-between px-2 z-[200] pointer-events-none">
          <button onClick={() => setLeftOpen(!leftOpen)} className="p-3 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 backdrop-blur-md pointer-events-auto">
            {leftOpen ? <HiChevronLeft size={20}/> : <HiChevronRight size={20}/>}
          </button>
          <button onClick={() => setRightOpen(!rightOpen)} className="p-3 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 backdrop-blur-md pointer-events-auto">
            {rightOpen ? <HiChevronRight size={20}/> : <HiChevronLeft size={20}/>}
          </button>
        </div>

        <div className="max-w-xl mx-auto py-8 px-4 pb-32">
          {/* স্টোরি সেকশন */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar mb-10 pb-2">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-[2rem] border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 hover:border-cyan-500 hover:text-cyan-500 transition-all cursor-pointer"><FaPlus/></div>
              <span className="text-[8px] font-black uppercase text-zinc-600">Soul Sync</span>
            </div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-[2rem] border-2 border-cyan-500/30 p-1 bg-zinc-900">
                  <img src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-full h-full rounded-[1.8rem] object-cover grayscale hover:grayscale-0 transition-all" alt=""/>
                </div>
                <span className="text-[8px] font-black uppercase text-zinc-500 italic">Drifter_{i}</span>
              </div>
            ))}
          </div>

          {/* পোস্ট কার্ডস */}
          <div className="space-y-8">
            {posts.map((p, index) => (
              <motion.div key={p.id || index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`${glassStyle} rounded-[2.5rem] p-6 group`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleProfileClick(p.authorAuth0Id)}>
                    <div className="relative">
                       <img src={p.authorAvatar || `https://i.pravatar.cc/150?u=${index}`} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:border-cyan-500/50 transition-all shadow-2xl" alt=""/>
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-lg flex items-center justify-center border-2 border-[#050508]">
                         <FaCheckCircle size={8} className="text-black" />
                       </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase italic tracking-wider flex items-center gap-2">
                        {p.authorName || "Unknown_Drifter"}
                        {index % 3 === 0 && <span className="text-[7px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-black">AI TWIN</span>}
                      </h4>
                      <p className="text-[8px] text-zinc-600 font-mono">SIGNAL_STRENGTH: 98.4%</p>
                    </div>
                  </div>
                  <button className="text-zinc-600 hover:text-cyan-400 transition-colors p-2"><FaUserPlus size={16} /></button>
                </div>

                <p className="text-[13px] font-normal text-zinc-300 mb-6 leading-relaxed italic">
                  "{p.content || p.desc}"
                </p>

                {(p.mediaUrl || p.imageUrl) && (
                  <div className="aspect-video bg-zinc-900 rounded-[2rem] mb-6 overflow-hidden border border-white/5 shadow-inner">
                      <img src={p.mediaUrl ? `${API_BASE_URL}${p.mediaUrl}` : p.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt=""/>
                  </div>
                )}

                <div className="flex gap-8 px-2 border-t border-white/5 pt-6">
                  <div className="flex items-center gap-2 group/icon cursor-pointer">
                    <FaHeart className="text-zinc-700 group-hover/icon:text-rose-500 transition-colors" />
                    <span className="text-[10px] text-zinc-600 font-black">1.2K</span>
                  </div>
                  <div className="flex items-center gap-2 group/icon cursor-pointer">
                    <FaComment className="text-zinc-700 group-hover/icon:text-cyan-400 transition-colors" />
                    <span className="text-[10px] text-zinc-600 font-black">452</span>
                  </div>
                  <FaShare className="text-zinc-700 hover:text-purple-400 cursor-pointer ml-auto" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- ৪. বটম নেভিগেশন (The Neural Orb) --- */}
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] z-[210]">
          <div className={`${glassStyle} rounded-full p-2 flex justify-between items-center px-8 relative border-white/20 shadow-[0_0_50px_rgba(6,182,212,0.2)]`}>
            <button className="p-4 text-zinc-500 hover:text-cyan-400 transition-colors" onClick={() => navigate('/search')}><FaSearch size={18} /></button>
            
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
               <AnimatePresence>
                {activeDrift && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-cyan-500 text-black px-4 py-1 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    <p className="text-[8px] font-black uppercase tracking-widest">{activeDrift}</p>
                  </motion.div>
                )}
               </AnimatePresence>

              <motion.button 
                onClick={startVoiceCommand}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-6 rounded-full border-4 border-[#050508] shadow-2xl relative transition-all duration-500 ${isListening ? 'bg-rose-500' : showPostSuccess ? 'bg-green-500' : 'bg-gradient-to-tr from-cyan-400 to-purple-600'}`}
              >
                {isListening ? <FaWaveSquare className="text-white animate-pulse" /> : <FaMicrophone className="text-white" />}
                {isListening && <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping" />}
              </motion.button>
            </div>

            <button className="p-4 text-zinc-500 hover:text-purple-400 transition-colors" onClick={() => navigate('/editor')}><FaPlus size={18} /></button>
          </div>
        </nav>
      </main>

      {/* --- ৫. ডান সাইডবার (Connects) --- */}
      <motion.aside
        initial={false}
        animate={{ x: rightOpen ? 0 : (window.innerWidth < 768 ? 350 : 0) }}
        className="fixed right-0 md:relative z-[150] w-[300px] h-full bg-[#050508]/95 border-l border-white/5 p-6 flex flex-col shrink-0"
      >
        <h3 className="text-[9px] font-black text-zinc-500 uppercase mb-8 tracking-[0.4em]">Neural Connects</h3>
        <div className="space-y-6 overflow-y-auto no-scrollbar">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 group cursor-pointer p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
              <div className="relative">
                <img src={`https://i.pravatar.cc/150?u=${i+30}`} className="w-10 h-10 rounded-xl object-cover grayscale" alt=""/>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-500 border-2 border-[#050508] rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase italic tracking-tighter text-zinc-300">Drifter_{i}9</p>
                <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">Lvl 45 Soul</p>
              </div>
              <button className="text-[8px] font-black px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-cyan-500 hover:text-black transition-all">LINK</button>
            </div>
          ))}
        </div>
      </motion.aside>

      {(leftOpen || rightOpen) && <div onClick={() => {setLeftOpen(false); setRightOpen(false);}} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[140] md:hidden" />}
    </div>
  );
};

export default Feed;