import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Check } from 'lucide-react';
import axios from 'axios';

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.nickname || "",
    bio: user?.bio || "",
    location: user?.location || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // আপনার এপিআই কল এখানে হবে
      // await axios.put('/api/user/update', formData);
      onUpdate(formData);
      onClose();
    } catch (err) {
      console.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f172a] w-full max-w-lg rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-black italic text-cyan-400">EDIT NEURAL IDENTITY</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Photo Edit */}
          <div className="relative h-32 bg-white/5 rounded-2xl overflow-hidden border border-dashed border-white/20 flex items-center justify-center group">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="text-center">
              <ImageIcon className="mx-auto text-gray-500 mb-1" />
              <p className="text-[10px] font-bold text-gray-500">CHANGE COVER</p>
            </div>
          </div>

          {/* Profile Photo Edit */}
          <div className="flex justify-center -mt-12">
            <div className="relative group">
              <img src={user?.picture} className="w-24 h-24 rounded-3xl border-4 border-[#0f172a] object-cover" />
              <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-400" 
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-400 h-24" 
              placeholder="Bio (Neural Signature)"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-black italic tracking-widest text-sm shadow-lg shadow-cyan-500/20"
          >
            {loading ? "SYNCING..." : "UPDATE IDENTITY"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;