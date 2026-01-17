import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiXMark, HiOutlinePencil, HiOutlineFaceSmile, 
  HiOutlineMusicalNote, HiOutlineSparkles, HiOutlineChevronRight,
  HiOutlineAdjustmentsHorizontal
} from "react-icons/hi2";

const StoryEditor = ({ selectedFile, onCancel, onPost, isUploading }) => {
  const [text, setText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [activeFilter, setActiveFilter] = useState("none");
  const [textColor, setTextColor] = useState("#ffffff");

  // ফিল্টার লিস্ট
  const filters = [
    { name: "None", class: "contrast-100 brightness-100 grayscale-0" },
    { name: "Bright", class: "brightness-125 contrast-110" },
    { name: "Vintage", class: "sepia-[0.5] contrast-90" },
    { name: "Noir", class: "grayscale brightness-90" },
    { name: "Cold", class: "hue-rotate-180 saturate-150" },
  ];

  return (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col overflow-hidden"
    >
      {/* --- Header --- */}
      <div className="absolute top-8 left-0 right-0 px-4 flex justify-between items-center z-[720]">
        <button onClick={onCancel} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md">
          <HiXMark size={28} />
        </button>
        <div className="flex gap-3">
          <button className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md"><HiOutlineMusicalNote size={24} /></button>
          <button onClick={() => setShowTextInput(true)} className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md"><HiOutlinePencil size={24} /></button>
        </div>
      </div>

      {/* --- Main Preview Area --- */}
      <div className="flex-1 relative flex items-center justify-center bg-zinc-950">
        <div className={`relative w-full h-full transition-all duration-500 ${filters.find(f => f.name === activeFilter)?.class}`}>
          <img 
            src={URL.createObjectURL(selectedFile)} 
            className="w-full h-full object-cover" 
            alt="preview" 
          />
        </div>
        
        {/* Floating Text */}
        {text && (
          <motion.div 
            drag 
            style={{ color: textColor }}
            className="absolute p-4 bg-black/20 backdrop-blur-sm rounded-lg font-bold text-3xl cursor-move text-center drop-shadow-2xl"
          >
            {text}
          </motion.div>
        )}
      </div>

      {/* --- Filter Selection --- */}
      <div className="px-4 py-4 flex gap-3 overflow-x-auto no-scrollbar bg-black/50 backdrop-blur-md">
        {filters.map((f) => (
          <button
            key={f.name}
            onClick={() => setActiveFilter(f.name)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === f.name ? "bg-white text-black scale-105" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* --- Bottom Tool Bar --- */}
      <div className="p-6 bg-black space-y-4">
        <div className="flex justify-around items-center bg-zinc-900/50 py-4 rounded-2xl border border-white/5 shadow-2xl">
          <button onClick={() => setShowTextInput(true)} className="flex flex-col items-center gap-1 text-zinc-400">
            <HiOutlinePencil size={22} />
            <span className="text-[10px]">Text</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-400">
            <HiOutlineFaceSmile size={22} />
            <span className="text-[10px]">Sticker</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-500">
            <HiOutlineAdjustmentsHorizontal size={22} />
            <span className="text-[10px]">Edit</span>
          </button>
        </div>

        <button 
          disabled={isUploading}
          onClick={() => onPost(selectedFile, text, activeFilter)} 
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            isUploading ? "bg-zinc-700 cursor-not-allowed" : "bg-blue-600 shadow-blue-600/30 active:scale-95"
          }`}
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Uploading...
            </>
          ) : (
            <>
              Share Story <HiOutlineChevronRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* --- Text Input Overlay --- */}
      <AnimatePresence>
        {showTextInput && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="flex gap-4 mb-10">
              {["#ffffff", "#ff3b30", "#ffcc00", "#4cd964", "#5ac8fa", "#007aff", "#5856d6"].map(color => (
                <button 
                  key={color} 
                  onClick={() => setTextColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${textColor === color ? 'border-white scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <input 
              autoFocus
              className="bg-transparent border-none outline-none text-white text-4xl font-extrabold text-center w-full"
              style={{ color: textColor }}
              placeholder="Aa"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setShowTextInput(false)}
            />
            
            <button 
              onClick={() => setShowTextInput(false)} 
              className="absolute top-12 right-6 px-4 py-2 bg-white text-black rounded-full font-bold text-sm"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StoryEditor;