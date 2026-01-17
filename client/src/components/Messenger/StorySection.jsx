import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiPlus, HiXMark, HiOutlineTrash, HiOutlineEye } from "react-icons/hi2";

const StorySection = ({ activeUsers, user, storyInputRef, onStoryUpload }) => {
  const [selectedStory, setSelectedStory] = useState(null);

  return (
    <>
      {/* --- Horizontal Story Bar --- */}
      <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar mb-4 py-2">
        {/* Your Story Add Button */}
        <div onClick={() => storyInputRef.current.click()} className="flex flex-col items-center gap-1 min-w-[65px] cursor-pointer">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 hover:bg-zinc-800 transition-colors">
            <HiPlus size={24} className="text-blue-500" />
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">Your Story</span>
        </div>

        {/* Active Users Stories */}
        {activeUsers.filter(u => u.userId !== user?.sub).map((au, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedStory({ 
                name: `User_${au.userId.slice(-4)}`, 
                image: `https://picsum.photos/400/700?random=${i}`, // এখানে ডাটাবেজ থেকে আসা ইমেজ হবে
                isOwn: false 
            })} 
            className="flex flex-col items-center gap-1 min-w-[65px] cursor-pointer"
          >
            <div className="relative p-0.5 border-2 border-blue-600 rounded-full">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${au.userId}`} 
                className="w-12 h-12 rounded-full bg-zinc-800 object-cover" 
                alt=""
              />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></div>
            </div>
            <span className="text-[11px] text-zinc-300 truncate w-14 text-center">Active</span>
          </div>
        ))}
      </div>

      {/* --- Full Screen Story Viewer --- */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.1 }} 
            className="fixed inset-0 z-[600] bg-black"
          >
            {/* Top Progress Bar */}
            <div className="absolute top-4 left-0 right-0 px-2 flex gap-1 z-[610]">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '100%' }} 
                  transition={{ duration: 5 }} 
                  onAnimationComplete={() => setSelectedStory(null)} 
                  className="h-full bg-white" 
                />
              </div>
            </div>

            {/* Header */}
            <div className="absolute top-8 left-0 right-0 px-4 flex justify-between items-center z-[610]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden bg-zinc-800">
                  <img src={selectedStory.image} alt=""/>
                </div>
                <span className="font-bold text-sm text-white drop-shadow-md">{selectedStory.name}</span>
              </div>
              <button 
                onClick={() => setSelectedStory(null)} 
                className="p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md text-white transition-all"
              >
                <HiXMark size={24}/>
              </button>
            </div>

            {/* Story Image */}
            <img src={selectedStory.image} className="w-full h-full object-contain" alt="story"/>

            {/* Bottom Actions */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-12 text-white/80 z-[610]">
              <div className="flex flex-col items-center">
                <HiOutlineEye size={24}/>
                <span className="text-[10px] mt-1">24 Views</span>
              </div>
              
              <button 
                onClick={() => {
                   if(window.confirm("Delete this story?")) {
                      setSelectedStory(null);
                      // API Call for delete
                   }
                }}
                className="flex flex-col items-center text-red-500"
              >
                <HiOutlineTrash size={24}/>
                <span className="text-[10px] mt-1">Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StorySection;