import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Bell, Moon, LogOut, Shield, ChevronRight, 
  Palette, EyeOff, ShieldCheck, Smartphone, ArrowLeft,
  Cpu, SlidersHorizontal, Zap // এখানে AdjustmentsHorizontal পরিবর্তন করে SlidersHorizontal করা হয়েছে
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [autopilot, setAutopilot] = useState(true); // AI Autopilot State
  const [aiPersonality, setAiPersonality] = useState(50); // AI Mood Slider
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = "https://onyx-drift-app-final.onrender.com";

  // ১. ইউজার ডাটা এবং এআই সেটিংস লোড করা
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_URL}/api/user/me`, {
          headers: { 'x-auth-token': token }
        });
        setGhostMode(res.data.ghostMode);
        setAutopilot(res.data.aiAutopilot ?? true);
        setAiPersonality(res.data.aiTone ?? 50);
      } catch (err) {
        console.error("Error fetching settings");
      }
    };
    fetchUserSettings();
  }, []);

  // ২. Ghost Mode এবং AI Autopilot টগল লজিক
  const handleToggle = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = type === 'ghost' ? '/api/user/toggle-ghost' : '/api/user/toggle-autopilot';
      
      const res = await axios.put(`${API_URL}${endpoint}`, {}, {
        headers: { 'x-auth-token': token }
      });

      if (type === 'ghost') setGhostMode(res.data.ghostMode);
      else setAutopilot(res.data.aiAutopilot);

    } catch (err) {
      console.error("Neural Sync Failure!");
    } finally {
      setLoading(false);
    }
  };

  // ৩. AI Personality আপডেট (Slider Change)
  const updateAiTone = async (val) => {
    setAiPersonality(val);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/user/update-ai-tone`, { tone: val }, {
        headers: { 'x-auth-token': token }
      });
    } catch (err) {
      console.error("Tone sync failed");
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter new neural-key (6+ chars):");
    if (newPassword && newPassword.length >= 6) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/user/change-password`, { password: newPassword }, {
          headers: { 'x-auth-token': token }
        });
        alert("Neural-key updated!");
      } catch (err) {
        alert("Update failed");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto p-0 min-h-screen bg-[#010409] text-white font-mono overflow-y-auto custom-scrollbar pb-20">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-[#010409]/80 backdrop-blur-xl sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full text-cyan-400 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase">
            System_Config
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* SECTION: AI SHADOW (NEW) */}
        <section>
          <p className="text-purple-500/70 text-[10px] font-black uppercase tracking-[0.3em] mb-4 px-2">Neural Shadow (AI)</p>
          <div className="bg-[#0d1117] rounded-[2.5rem] overflow-hidden border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
            
            {/* Autopilot Toggle */}
            <div className="p-6 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                  <Cpu size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm italic">Autonomous Drift</h3>
                  <p className="text-gray-500 text-[9px] uppercase tracking-tighter">AI posts while you sleep</p>
                </div>
              </div>
              <Switch active={autopilot} toggle={() => handleToggle('autopilot')} disabled={loading} color="bg-purple-500" />
            </div>

            {/* AI Tone Slider */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-400">
                  <SlidersHorizontal size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm italic">Personality Calibration</h3>
                  <p className="text-gray-500 text-[9px] uppercase">Cold/Passive vs Hyper-Social</p>
                </div>
              </div>
              
              <input 
                type="range" min="0" max="100" 
                value={aiPersonality}
                onChange={(e) => updateAiTone(e.target.value)}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between mt-3 text-[8px] font-black uppercase text-gray-600 tracking-tighter">
                <span className={aiPersonality < 30 ? "text-purple-400" : ""}>Passive</span>
                <span className={aiPersonality >= 30 && aiPersonality <= 70 ? "text-purple-400" : ""}>Analytical</span>
                <span className={aiPersonality > 70 ? "text-purple-400" : ""}>Social</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: NEURAL SECURITY */}
        <section>
          <p className="text-cyan-500/50 text-[10px] font-black uppercase tracking-[0.3em] mb-4 px-2">Neural Security</p>
          <div className="bg-[#0d1117] rounded-[2.5rem] overflow-hidden border border-cyan-500/20">
            <div className="p-6 flex items-center justify-between border-b border-white/5 hover:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <EyeOff size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm italic tracking-wide">Ghost Mode</h3>
                  <p className="text-gray-500 text-[9px] uppercase tracking-tighter">Invisible to neural-scans</p>
                </div>
              </div>
              <Switch active={ghostMode} toggle={() => handleToggle('ghost')} disabled={loading} color="bg-cyan-500" />
            </div>

            <SettingItem 
              icon={ShieldCheck} 
              title="Neural Key" 
              subtitle="Update system access key" 
              onClick={handleChangePassword}
              color="text-purple-400"
              bg="bg-purple-500/10"
            />
          </div>
        </section>

        {/* SECTION: PREFERENCES */}
        <section>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 px-2">Core Preferences</p>
          <div className="bg-[#0d1117] rounded-[2.5rem] overflow-hidden border border-white/5">
            <SettingItem 
              icon={User} 
              title="Identity Node" 
              subtitle="Modify name, bio, and avatar" 
              onClick={() => navigate('/edit-profile')}
            />
            
            <div className="flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400"><Moon size={22}/></div>
                <div>
                  <h3 className="font-bold text-sm italic">Dark Protocol</h3>
                  <p className="text-gray-500 text-[9px] uppercase">Always Active</p>
                </div>
              </div>
              <Switch active={darkMode} toggle={() => setDarkMode(!darkMode)} color="bg-yellow-500" />
            </div>

            <SettingItem icon={Bell} title="Pulse Alerts" subtitle="Neural notification sync" />
          </div>
        </section>

        {/* TERMINATION */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-6 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-[2.5rem] transition-all border border-red-500/10 font-black italic uppercase tracking-[0.2em] text-xs"
        >
          <LogOut size={18} />
          Terminate Session
        </motion.button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #161b22; border-radius: 10px; }
      `}</style>
    </div>
  );
};

// Reusable Sub-Component
const SettingItem = ({ icon: Icon, title, subtitle, onClick, color = "text-blue-400", bg = "bg-blue-500/10" }) => (
  <div onClick={onClick} className="flex items-center justify-between p-6 hover:bg-white/[0.03] cursor-pointer transition-all border-b border-white/5 last:border-0">
    <div className="flex items-center gap-4">
      <div className={`p-3 ${bg} rounded-2xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="font-bold text-sm italic tracking-wide text-gray-200">{title}</h3>
        <p className="text-gray-500 text-[9px] uppercase tracking-tighter">{subtitle}</p>
      </div>
    </div>
    <ChevronRight className="text-gray-700" size={16} />
  </div>
);

const Switch = ({ active, toggle, disabled, color = "bg-cyan-500" }) => (
  <div 
    onClick={!disabled ? toggle : null} 
    className={`w-12 h-6 rounded-full p-1 transition-all duration-500 cursor-pointer flex items-center ${active ? `${color} shadow-[0_0_10px_rgba(255,255,255,0.2)]` : 'bg-[#161b22] border border-white/5'} ${disabled ? 'opacity-30' : ''}`}
  >
    <motion.div 
      animate={{ x: active ? 24 : 0 }}
      className={`w-4 h-4 rounded-full shadow-sm ${active ? 'bg-white' : 'bg-gray-600'}`} 
    />
  </div>
);

export default Settings;