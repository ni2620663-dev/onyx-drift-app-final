import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaZap } from 'react-icons/fa';

const NeuralToast = ({ isVisible, message, type = "activity" }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.8 }}
          className="fixed top-20 right-4 z-[9999] pointer-events-none"
        >
          <div className="bg-black/80 backdrop-blur-2xl border border-purple-500/40 p-4 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-4 min-w-[250px]">
            <div className="relative">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                <FaBrain className="animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </div>
            
            <div>
              <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-0.5">
                Neural Shadow Sync
              </h4>
              <p className="text-[11px] text-gray-300 font-mono italic">
                {message || "Optimizing your digital presence..."}
              </p>
            </div>

            <div className="ml-auto">
              <FaZap className="text-yellow-500 text-[10px] animate-bounce" />
            </div>
          </div>
          
          {/* নিচের ছোট প্রগ্রেস বার */}
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4 }}
            className="h-0.5 bg-purple-500 mt-1 rounded-full shadow-[0_0_10px_#a855f7]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NeuralToast;