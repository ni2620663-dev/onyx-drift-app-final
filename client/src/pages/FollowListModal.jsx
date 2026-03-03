import React from 'react';
import { motion } from 'framer-motion';
import { HiXMark } from "react-icons/hi2";
import { useNavigate } from 'react-router-dom';

const FollowListModal = ({ isOpen, onClose, title, list }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black border border-zinc-800 w-full max-w-md h-[500px] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-900">
          <h3 className="font-black uppercase tracking-widest text-sm text-cyan-500">{title}</h3>
          <button onClick={onClose} className="text-white hover:bg-zinc-900 p-2 rounded-full transition-colors">
            <HiXMark size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {list && list.length > 0 ? (
            list.map((person) => (
              <div 
                key={person.auth0Id}
                onClick={() => {
                  navigate(`/profile/${person.auth0Id}`);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 hover:bg-zinc-900/50 rounded-xl cursor-pointer transition-all group"
              >
                <img 
                  src={person.avatar || person.picture} 
                  className="w-10 h-10 rounded-full object-cover border border-zinc-800" 
                  alt="avatar" 
                />
                <div className="flex-1">
                  <h4 className="text-sm font-bold group-hover:text-cyan-400 transition-colors">{person.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">@{person.nickname}</p>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full text-[10px] font-black uppercase hover:bg-cyan-400 transition-all">
                  View
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-tighter">
              No Neural Links Established
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FollowListModal;