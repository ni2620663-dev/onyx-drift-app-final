import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { HiOutlineXMark, HiOutlineCloudArrowUp } from "react-icons/hi2";

const CreateNodeModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({ name: "", topic: "Cyberpunk", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // তোমার ব্যাকএন্ড API এন্ডপয়েন্ট
      await axios.post("https://onyx-drift-app-final.onrender.com/api/communities/create", formData);
      onCreated(); // লিস্ট আপডেট করার জন্য
      onClose();
    } catch (err) {
      console.error("Failed to create node");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden"
      >
        {/* Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[60px]" />

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Initialize New Node</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><HiOutlineXMark size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Node Identity</label>
            <input 
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-cyan-500/50 transition-all"
              placeholder="e.g. NEURAL CODERS"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Neural Category</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-cyan-500/50 transition-all text-gray-400"
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
            >
              <option>Cyberpunk</option>
              <option>Digital Art</option>
              <option>AI Generated</option>
              <option>Tech</option>
            </motion.select>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Node Objective</label>
            <textarea 
              rows="3"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-cyan-500/50 transition-all"
              placeholder="Briefly describe this community..."
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? "Syncing..." : "ESTABLISH NODE"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateNodeModal;