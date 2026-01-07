import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaMicrophone, FaPlus, FaSearch, FaHeart, 
  FaComment, FaShare, FaWaveSquare, FaCheckCircle,
  FaHome, FaRocket, FaUserAlt, FaCog, FaChartLine, FaUserPlus
} from 'react-icons/fa';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

// API Endpoint Logic - Cleaned for Production
const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://onyx-drift-api-server.onrender.com").replace(/\/$/, "");

const PremiumHomeFeed = () => {
  const navigate = useNavigate();
  const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();

  // States
  const [isListening, setIsListening] = useState(false);
  const [activeDrift, setActiveDrift] = useState(null);
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [posts, setPosts] = useState([]); // রিয়েল পোস্ট স্টোর করার জন্য

  // ১. ডাটাবেস থেকে পোস্ট নিয়ে আসার ফাংশন
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
    // অটো রিফ্রেশ (প্রতি ১০ সেকেন্ডে)
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, []);

  // ২. ফলো/কানেক্ট হ্যান্ডলার
  const handleFollow = async (targetUserId) => {
    try {
      console.log(`Connecting to: ${targetUserId}`);
      setActiveDrift(`Linking: ${targetUserId}`);
      // এখানে আপনার ব্যাকএন্ড ফলো এপিআই কল করতে পারেন
      setTimeout(() => setActiveDrift(null), 2000);
    } catch (e) {
      setActiveDrift("Link Failed");
    }
  };

  // ভয়েস কমান্ড ফাংশন
  const startVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Neural Voice System not supported. Please use Chrome.");
      return;
    }
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleNeuralAction = async (cmd) => {
    if (cmd.includes("post") || cmd.includes("create")) {
      const content = cmd.replace(/create post|make post|new post|post/g, "").trim();
      if (!content) { 
        setActiveDrift("Empty Content"); 
        setTimeout(() => setActiveDrift(null), 2000);
        return; 
      }
      
      try {
        setActiveDrift("Transmitting...");
        const token = await getAccessTokenSilently();
        
        const formData = new FormData();
        formData.append("text", content);
        formData.append("authorName", user?.nickname || user?.name || "Anonymous");
        formData.append("authorAvatar", user?.picture || "");

        await axios.post(`${API_BASE_URL}/api/posts`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        });

        setActiveDrift("Post Live!");
        setShowPostSuccess(true);
        fetchPosts(); // নতুন পোস্ট আসার পর লিস্ট আপডেট
        setTimeout(() => {
          setActiveDrift(null); 
          setShowPostSuccess(false);
        }, 3000);
      } catch (e) { 
        setActiveDrift("Sync Failed"); 
        setTimeout(() => setActiveDrift(null), 2000);
      }
    } 
    else if (cmd.includes("search")) {
      const q = cmd.replace("search", "").trim();
      navigate(`/search?q=${q}`);
    }
  };

  const glassStyle = "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]";

  return (
    <div className="flex w-full h-screen bg-[#050508] text-white overflow-hidden font-sans">
      
      {/* --- ২. বাম সাইডবার --- */}
      <motion.aside
        initial={false}
        animate={{ x: leftOpen ? 0 : (window.innerWidth < 768 ? -320 : 0) }}
        className="fixed md:relative z-[150] w-[280px] h-full bg-[#0f172a]/95 md:bg-transparent border-r border-white/5 p-6 flex flex-col shrink-0"
      >
        <div className="mb-10 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-black text-black italic">OX</div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Neural Menu</h2>
        </div>
        
        <nav className="space-y-2">
            {[
                { name: 'Feed', icon: <FaHome />, active: true },
                { name: 'Explore', icon: <FaRocket /> },
                { name: 'Analytics', icon: <FaChartLine /> },
                { name: 'Profile', icon: <FaUserAlt /> },
                { name: 'Settings', icon: <FaCog /> },
            ].map((item) => (
                <div key={item.name} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${item.active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white'}`}>
                    {item.icon}
                    <span className="text-xs font-black uppercase tracking-widest italic">{item.name}</span>
                </div>
            ))}
        </nav>
      </motion.aside>

      {/* --- ৩. মেইন ফিড --- */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar relative">
        
        <div className="md:hidden fixed top-1/2 -translate-y-1/2 w-full flex justify-between px-2 z-[200] pointer-events-none">
          <button 
            onClick={() => {setLeftOpen(!leftOpen); setRightOpen(false);}}
            className="p-3 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 backdrop-blur-md pointer-events-auto"
          >
            {leftOpen ? <HiChevronLeft size={20}/> : <HiChevronRight size={20}/>}
          </button>

          <button 
            onClick={() => {setRightOpen(!rightOpen); setLeftOpen(false);}}
            className="p-3 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 backdrop-blur-md pointer-events-auto"
          >
            {rightOpen ? <HiChevronRight size={20}/> : <HiChevronLeft size={20}/>}
          </button>
        </div>

        <div className="max-w-xl mx-auto py-8 px-4 pb-32">
          {/* স্টোরি সেকশন */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar mb-10">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-500"><FaPlus/></div>
              <span className="text-[9px] font-bold uppercase text-gray-500">Add</span>
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-3xl border-2 border-cyan-500/50 p-1">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-full h-full rounded-[1.2rem] object-cover" alt=""/>
                </div>
                <span className="text-[9px] font-bold uppercase text-gray-400">Drifter</span>
              </div>
            ))}
          </div>

          {/* পোস্ট কার্ডস (রিয়েল ডাটা কানেক্টেড) */}
          <div className="space-y-6">
            {posts.map((p, index) => (
              <motion.div key={p.id || index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${glassStyle} rounded-[2.5rem] p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <img src={p.authorAvatar || `https://i.pravatar.cc/150?u=${index}`} className="w-10 h-10 rounded-xl border border-white/10" alt=""/>
                    <div>
                      <h4 className="text-[12px] font-black uppercase italic tracking-tighter">{p.authorName || "Anonymous_Drifter"}</h4>
                      {/* ইউজার আইডি বার */}
                      <p className="text-[7px] text-gray-500 font-mono tracking-tighter">SIGNAL_ID: {p.id || 'SYNCING...'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleFollow(p.authorName)} className="text-cyan-500 hover:text-white p-2">
                    <FaUserPlus size={14} />
                  </button>
                </div>

                {/* পোস্টের টেক্সট কন্টেন্ট */}
                <p className="text-sm font-light text-gray-200 mb-4 leading-relaxed">
                  {p.content || p.desc}
                </p>

                {/* পোস্টের মিডিয়া */}
                {(p.mediaUrl || p.imageUrl) && (
                  <div className="aspect-video bg-white/5 rounded-[2rem] mb-4 overflow-hidden border border-white/5">
                      <img src={p.mediaUrl ? `${API_BASE_URL}${p.mediaUrl}` : p.imageUrl} className="w-full h-full object-cover opacity-90" alt=""/>
                  </div>
                )}

                <div className="flex gap-6 px-2">
                  <FaHeart className="text-gray-500 hover:text-rose-500 transition-colors cursor-pointer" />
                  <FaComment className="text-gray-500 hover:text-cyan-400 cursor-pointer" />
                  <FaShare className="text-gray-500 hover:text-purple-400 cursor-pointer" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ৪. বটম নেভিগেশন (The Orb) */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-[210]">
          <div className={`${glassStyle} rounded-[2.5rem] p-2 flex justify-between items-center px-10 relative border-white/20`}>
            <button className="p-4 text-gray-500 hover:text-cyan-400 transition-colors" onClick={() => navigate('/search')}>
              <FaSearch size={20} />
            </button>
            
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
               <AnimatePresence>
                {activeDrift && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-black/90 backdrop-blur-xl px-4 py-1.5 rounded-full border border-cyan-500/30">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">{activeDrift}</p>
                  </motion.div>
                )}
               </AnimatePresence>

              <motion.button 
                onClick={startVoiceCommand}
                whileTap={{ scale: 0.9 }}
                className={`p-5 rounded-full border-4 border-[#050508] relative ${isListening ? 'bg-rose-500 animate-pulse' : showPostSuccess ? 'bg-green-500' : 'bg-gradient-to-tr from-cyan-500 to-purple-600'}`}
              >
                {isListening ? <FaWaveSquare className="text-white text-xl" /> : <FaMicrophone className="text-white text-xl" />}
              </motion.button>
            </div>

            <button className="p-4 text-gray-500 hover:text-purple-400 transition-colors">
              <FaPlus size={20} />
            </button>
          </div>
        </nav>
      </main>

      {/* --- ৫. ডান সাইডবার (Connects) --- */}
      <motion.aside
        initial={false}
        animate={{ x: rightOpen ? 0 : (window.innerWidth < 768 ? 350 : 0) }}
        className="fixed right-0 md:relative z-[150] w-[320px] h-full bg-[#0f172a]/95 md:bg-transparent border-l border-white/5 p-6 flex flex-col shrink-0"
      >
        <h3 className="text-[10px] font-black text-gray-500 uppercase mb-8 tracking-[0.3em]">Neural Connects</h3>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-white/5 rounded-2xl transition-all">
              <div className="relative">
                <img src={`https://i.pravatar.cc/150?u=${i+20}`} className="w-10 h-10 rounded-xl object-cover" alt=""/>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#050508] rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase italic tracking-tighter">Drifter_Alpha_{i}</p>
                {/* আইডি ডিসপ্লে বার */}
                <p className="text-[7px] text-gray-500 font-bold uppercase">ID: OX-LINK-{i}99</p>
              </div>
              <button onClick={() => handleFollow(`OX-LINK-${i}99`)} className="text-[8px] font-black px-3 py-1.5 border border-cyan-500/30 text-cyan-400 rounded-lg group-hover:bg-cyan-500 group-hover:text-black transition-all">CONNECT</button>
            </div>
          ))}
        </div>
      </motion.aside>

      {(leftOpen || rightOpen) && (
        <div onClick={() => {setLeftOpen(false); setRightOpen(false);}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] md:hidden" />
      )}
    </div>
  );
};

export default PremiumHomeFeed;