import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";

const Landing = () => {
  const { loginWithRedirect } = useAuth0();

  // গ্লিচ ইফেক্টের জন্য অ্যানিমেশন ভ্যারিয়েন্ট
  const glitchText = {
    initial: { skewX: 0 },
    animate: {
      skewX: [0, -2, 2, 0],
      transition: {
        duration: 0.2,
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
  };

  const aiFeatures = [
    { 
      title: "Neural Shadow", 
      desc: "Your AI twin writes posts and handles chats in your unique voice.", 
      icon: "🧠" 
    },
    { 
      title: "Auto-Cinema", 
      desc: "AI automatically edits and generates Reels from your memories.", 
      icon: "🎬" 
    },
    { 
      title: "Mood Feed", 
      desc: "An intelligent feed that adapts to your neural activity and mood.", 
      icon: "⚡" 
    },
    { 
      title: "AI Shield", 
      desc: "Autonomous security that makes your data un-hackable.", 
      icon: "🛡️" 
    }
  ];

  return (
    <div className="min-h-screen w-full bg-black relative overflow-x-hidden flex flex-col items-center">
      
      {/* 🎥 Background Video Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-10" /> 
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source 
            src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-and-data-4430-large.mp4" 
            type="video/mp4" 
          />
        </video>
      </div>

      {/* 🌫️ Background Effects */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full z-0" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%]" />

      {/* --- HERO SECTION --- */}
      <section className="relative z-30 min-h-screen flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Glitchy Title */}
          <motion.h1 
            variants={glitchText}
            initial="initial"
            animate="animate"
            className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-6 italic uppercase relative inline-block"
          >
            <span className="relative z-10">ONYX<span className="text-cyan-500">DRIFT</span></span>
            <span className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-30 blur-[1px] -z-10 animate-pulse">ONYXDRIFT</span>
            <span className="absolute top-0 left-0 ml-[2px] text-blue-500 opacity-30 blur-[1px] -z-10 animate-pulse">ONYXDRIFT</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-cyan-400 text-sm md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed font-mono uppercase tracking-[0.3em]"
          >
            A Social Network with a Brain of its own. 
            <br />
            <span className="text-white/50 italic lowercase tracking-normal">You live the life. Your AI Shadow handles the legacy.</span>
          </motion.p>

          {/* ⚡ Neural Login Bar */}
          <div className="relative group max-w-md mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-600 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-gradient-x"></div>
            
            <button 
              onClick={() => loginWithRedirect()}
              className="relative w-full px-10 py-5 bg-black rounded-full border border-cyan-500/30 text-white font-black text-xl flex items-center justify-center gap-3 hover:bg-cyan-500 hover:text-black transition-all duration-300 active:scale-95 group"
            >
              <span className="w-2 h-2 bg-cyan-500 rounded-full group-hover:bg-black animate-ping" />
              INITIALIZE NEURAL LINK
            </button>
          </div>
        </motion.div>
      </section>

      {/* --- AI FEATURE CARDS SECTION --- */}
      <section className="relative z-30 py-24 w-full max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-cyan-500 font-mono text-xs tracking-[0.5em] uppercase mb-2">System Capabilities</h2>
          <h3 className="text-white text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Autonomous Core Features</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aiFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20, borderColor: "rgba(255, 255, 255, 0.1)" }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10, borderColor: "rgba(6, 182, 212, 0.5)" }}
              className="p-8 bg-white/5 backdrop-blur-xl border rounded-[2.5rem] text-left transition-all group"
            >
              <div className="text-4xl mb-6 bg-cyan-500/10 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-xl mb-3 uppercase tracking-tight">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-mono italic">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- DATA POINTS (STATICS) --- */}
      <div className="relative z-30 w-full py-10 border-t border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between gap-8 opacity-40">
          <div>
            <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Latency</p>
            <p className="text-white font-bold">14MS</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Encryption</p>
            <p className="text-white font-bold">AES-256-GCM</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Active Nodes</p>
            <p className="text-white font-bold">DRIFT_VOID_01</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Security Status</p>
            <p className="text-white font-bold">UNBREACHABLE</p>
          </div>
        </div>
      </div>

      <footer className="relative z-30 py-12 opacity-20 text-center">
        <p className="text-[10px] font-mono text-white tracking-[0.5em] uppercase italic">
          © 2026 Onyx Drift // Neural Systems Integrated
        </p>
      </footer>
    </div>
  );
};

export default Landing;