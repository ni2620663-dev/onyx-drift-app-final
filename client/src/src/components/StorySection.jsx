import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

const StorySection = ({ user }) => {
  const stories = [
    { id: 1, name: 'Your Story', img: user?.picture, isMe: true },
    { id: 2, name: 'Alex', img: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'Sarah', img: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, name: 'David', img: 'https://i.pravatar.cc/150?u=4' },
    { id: 5, name: 'Emily', img: 'https://i.pravatar.cc/150?u=5' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
      {stories.map((story) => (
        <motion.div
          key={story.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
        >
          <div className={`relative p-[3px] rounded-[2rem] ${story.isMe ? 'bg-white/10' : 'bg-gradient-to-tr from-cyan-400 to-purple-600 shadow-neon-blue'}`}>
            <img
              src={story.img || "https://placehold.jp/150x150.png"}
              alt={story.name}
              className="w-16 h-20 object-cover rounded-[1.8rem] border-2 border-[#020617]"
            />
            {story.isMe && (
              <div className="absolute bottom-1 right-1 bg-cyan-400 text-black p-1 rounded-lg border-2 border-[#020617]">
                <FaPlus size={10} />
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            {story.name.split(' ')[0]}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default StorySection;