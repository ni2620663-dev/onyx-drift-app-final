import React, { useRef } from "react";
import { HiPlus, HiOutlineCamera, HiOutlinePhoto, HiOutlinePaperAirplane } from "react-icons/hi2";

const ChatInput = ({ newMessage, handleSend, handleInputChange, onFileSelect }) => {
  const imageInputRef = useRef(null);

  return (
    <div className="p-3 pb-8 flex items-center gap-2 bg-black border-t border-zinc-900">
      {/* Hidden Input for Images */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={(e) => onFileSelect(e, 'chat')} 
        className="hidden" 
        accept="image/*" 
      />
      
      <button onClick={() => imageInputRef.current.click()} className="text-blue-500 active:scale-90 transition-transform">
        <HiPlus size={24}/>
      </button>
      <button onClick={() => imageInputRef.current.click()} className="text-blue-500 active:scale-90 transition-transform">
        <HiOutlineCamera size={24}/>
      </button>
      <button onClick={() => imageInputRef.current.click()} className="text-blue-500 active:scale-90 transition-transform">
        <HiOutlinePhoto size={24}/>
      </button>

      <div className="flex-1 bg-zinc-900 rounded-full px-4 py-2 flex items-center focus-within:ring-1 ring-blue-500/50 transition-all">
        <input 
          value={newMessage} 
          onChange={handleInputChange} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Aa" 
          className="bg-transparent flex-1 outline-none text-sm text-white" 
        />
        <span className="text-blue-500 cursor-pointer">😊</span>
      </div>

      <button 
        onClick={handleSend} 
        disabled={!newMessage.trim()} 
        className={newMessage.trim() ? "text-blue-500" : "text-zinc-700"}
      >
        <HiOutlinePaperAirplane className="rotate-45" size={24}/>
      </button>
    </div>
  );
};

export default ChatInput;