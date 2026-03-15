import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    bio: '', 
    profilePic: null 
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 4) setStep(step + 1);
    else handleSubmit(e);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePic: URL.createObjectURL(file) });
    }
  };

  // --- Render ব্যাকএন্ডের জন্য আপডেট করা হ্যান্ডলার ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return alert("Please fill all fields");
    
    setLoading(true);
    try {
      const baseUrl = "https://onyx-drift-app-final-u29m.onrender.com";
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(isLogin ? "Login Successful!" : "Account Created Successfully!");
        window.location.href = "/feed";
      } else {
        alert("Error: " + (data.message || "Authentication Failed"));
      }
      
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="w-full h-full min-h-screen md:h-auto md:min-h-0 md:max-w-[600px] p-6 md:p-12 bg-black text-white flex flex-col justify-center">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <div className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter transition-all">
            OX<span className="text-cyan-500">.</span>
          </div>
          <div className="text-[10px] md:text-xs font-bold text-zinc-500 tracking-[0.4em] md:tracking-[0.6em] uppercase mt-2">
            OnyxDrift
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-6xl font-bold mb-8 md:mb-12 tracking-tight text-center md:text-left leading-tight">
          {isLogin ? "Happening now" : "Join OnyxDrift today"}
        </h1>

        <div className="w-full max-w-[350px] mx-auto md:mx-0">
          <form onSubmit={isLogin ? handleSubmit : handleNext} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : `step-${step}`}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {isLogin ? (
                  <div className="space-y-4">
                    <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    <Input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {step === 1 && (
                      <>
                        <Input type="text" placeholder="Full Name" onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                        <Input type="email" placeholder="Email Address" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        <Input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                      </>
                    )}
                    {step === 4 && (
                      <div className="flex flex-col items-center gap-6">
                        <div onClick={() => fileInputRef.current.click()} className="w-24 h-24 rounded-full border border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden bg-zinc-900 hover:bg-zinc-800 transition-all">
                          {formData.profilePic ? <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-[10px] text-zinc-500 uppercase font-bold text-center">Upload</span>}
                        </div>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
                        <textarea placeholder="Bio" className="w-full p-4 bg-transparent border border-zinc-800 rounded-xl text-white outline-none focus:border-cyan-500 min-h-[100px] text-base" onChange={(e) => setFormData({...formData, bio: e.target.value})} />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all active:scale-[0.97] text-base md:text-lg">
              {loading ? "Processing..." : (isLogin ? "Log in" : (step === 4 ? "Create account" : "Next"))}
            </button>
          </form>

          <div className="mt-12 md:mt-16">
            <h3 className="font-bold text-zinc-400 text-lg mb-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </h3>
            <button 
              onClick={() => { setIsLogin(!isLogin); setStep(1); }}
              className="w-full py-3 bg-transparent border border-zinc-700 text-cyan-500 font-bold rounded-full hover:bg-cyan-500/5 transition-all text-base md:text-lg"
            >
              {isLogin ? "Create account" : "Log in"}
            </button>
          </div>

          <p className="mt-8 text-[10px] md:text-[11px] text-zinc-600 text-center md:text-left leading-tight">
            By signing up, you agree to the <span className="text-cyan-700 cursor-pointer">Terms of Service</span> and <span className="text-cyan-700 cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

const Input = ({ ...props }) => (
  <input 
    {...props} 
    className="w-full p-4 bg-transparent border border-zinc-800 rounded-lg text-white placeholder-zinc-600 outline-none focus:border-cyan-500 transition-all text-base focus:ring-1 focus:ring-cyan-500" 
  />
);

export default AuthModal;