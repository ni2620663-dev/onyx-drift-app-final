import React, { useRef, useState } from "react";
import { HiPlus, HiOutlinePhoto, HiOutlinePaperAirplane } from "react-icons/hi2";
import { FaLock } from "react-icons/fa";
import TimeVaultPicker from "./TimeVaultPicker";
import MoodSelector from "./MoodSelector";

const ChatInput = ({ newMessage, handleSend, handleInputChange, onFileSelect }) => {
  const imageInputRef = useRef(null);
  
  // 🚀 ফিউচারিস্টিক স্টেটস
  const [capsuleDate, setCapsuleDate] = useState(null);
  const [selectedMood, setSelectedMood] = useState("Neural-Flow");

  // টাইম ক্যাপসুল ও মুড সহ মেসেজ পাঠানোর মডিফাইড ফাংশন
  const onExtendedSend = () => {
    if (!newMessage.trim()) return;
    
    // Parent handleSend এ ডেটা পাঠানো হচ্ছে
    handleSend(capsuleDate, selectedMood); 
    
    // পাঠানোর পর রিসেট
    setCapsuleDate(null);
    setSelectedMood("Neural-Flow");
  };

  return (
    <div className="p-3 pb-8 flex flex-col bg-black border-t border-zinc-900 relative">
      
      {/* ১. মুড সিলেক্টর (ইনপুট বক্সের ওপরে থাকবে) */}
      <MoodSelector currentMood={selectedMood} onSelectMood={setSelectedMood} />

      <div className="flex items-center gap-2 mt-2 relative">
        
        {/* টাইম ক্যাপসুল অ্যাক্টিভ থাকলে ইন্ডিকেটর */}
        {capsuleDate && (
          <div className="absolute -top-7 left-12 bg-cyan-600 text-[10px] text-white px-2 py-0.5 rounded-t-md flex items-center gap-1 animate-pulse">
            <FaLock size={8} /> Neural Vault Active: {new Date(capsuleDate).toLocaleDateString()}
          </div>
        )}

        {/* Hidden Input for Images */}
        <input 
          type="file" 
          ref={imageInputRef} 
          onChange={(e) => onFileSelect(e, 'chat')} 
          className="hidden" 
          accept="image/*" 
        />
        
        {/* বাটনসমূহ */}
        <button 
          onClick={() => imageInputRef.current.click()} 
          className="text-blue-500 active:scale-90 transition-transform"
        >
          <HiPlus size={24}/>
        </button>
        
        {/* 🚀 টাইম-ভল্ট পিকার */}
        <TimeVaultPicker onSelectTime={(date) => setCapsuleDate(date)} />

        <button 
          onClick={() => imageInputRef.current.click()} 
          className="text-blue-500 active:scale-90 transition-transform"
        >
          <HiOutlinePhoto size={24}/>
        </button>

        {/* ইনপুট ফিল্ড (মুড ও ক্যাপসুল অনুযায়ী স্টাইল চেঞ্জ হবে) */}
        <div className={`flex-1 ${capsuleDate ? 'ring-1 ring-cyan-500/50 bg-cyan-950/10' : 'bg-zinc-900'} rounded-full px-4 py-2 flex items-center focus-within:ring-1 ring-blue-500/50 transition-all`}>
          <input 
            value={newMessage} 
            onChange={handleInputChange} 
            onKeyDown={(e) => e.key === 'Enter' && onExtendedSend()}
            placeholder={capsuleDate ? "Write to the future..." : "Aa"} 
            className="bg-transparent flex-1 outline-none text-sm text-white" 
          />
          <span className="text-blue-500 cursor-pointer">😊</span>
        </div>

        {/* সেন্ড বাটন */}
        <button 
          onClick={onExtendedSend} 
          disabled={!newMessage.trim()} 
          className={newMessage.trim() ? "text-blue-500" : "text-zinc-700"}
        >
          <HiOutlinePaperAirplane className="rotate-45" size={24}/>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;