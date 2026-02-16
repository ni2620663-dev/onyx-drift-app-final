import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { X, Play, Users, Star, Check } from "lucide-react";
import axios from 'axios';
import toast from 'react-hot-toast';

const Marketplace = ({ isOpen, onClose, applyTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get("https://onyx-drift-app-final-u29m.onrender.com/api/marketplace/templates");
        setTemplates(res.data);
      } catch (err) {
        // Fallback static data if API fails
        setTemplates([
          { id: 1, title: "Cyberpunk Glow", author: "NeonVibes", usage: 1200, data: { filters: { brightness: 120, contrast: 150, saturate: 180, blur: 0 }, aiAutoEffects: 'glitch' } },
          { id: 2, title: "Vintage Film", author: "RetroKing", usage: 850, data: { filters: { brightness: 90, contrast: 110, saturate: 60, blur: 1, temperature: 20 } } }
        ]);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) fetchTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="bg-zinc-900 w-full max-w-5xl h-[80vh] rounded-[3rem] border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Community Marketplace</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Free Neural Templates by Global Creators</p>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 scrollbar-hide">
          {templates.map((template) => (
            <div key={template.id} className="group relative bg-white/5 rounded-[2rem] overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-all">
              {/* Preview Thumbnail */}
              <div className="aspect-[9/16] bg-zinc-800 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={40} className="text-white/20 group-hover:scale-125 transition-transform" />
                </div>
                <div className="absolute bottom-4 left-4">
                  <p className="text-xs font-black uppercase drop-shadow-lg">{template.title}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">by {template.author}</p>
                </div>
              </div>

              {/* Info & Use Button */}
              <div className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Users size={14} />
                  <span className="text-[10px] font-black">{template.usage}</span>
                </div>
                <button 
                  onClick={() => {
                    applyTemplate(template.data);
                    onClose();
                  }}
                  className="bg-cyan-500 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg shadow-cyan-500/20"
                >
                  Apply Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Marketplace;