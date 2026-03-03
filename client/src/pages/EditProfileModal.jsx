import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiXMark } from "react-icons/hi2";
import { FaCamera } from "react-icons/fa";
import axios from 'axios';
import { useAuth0 } from "@auth0/auth0-react";
import toast from 'react-hot-toast';

const BACKEND_URL = "https://onyx-drift-app-final-u29m.onrender.com";

export default function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const { getAccessTokenSilently } = useAuth0();
  
  // ১. টেক্সট ডাটা স্টেট
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || ""
  });

  // ২. ফাইল স্টেট
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ৩. আপডেট হ্যান্ডলার
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getAccessTokenSilently();
      
      // FormData তৈরি (ইমেজ পাঠানোর জন্য এটি আবশ্যক)
      const data = new FormData();
      data.append('name', formData.name);
      data.append('bio', formData.bio);
      data.append('location', formData.location);
      data.append('website', formData.website);
      
      if (avatarFile) data.append('avatar', avatarFile);
      if (coverFile) data.append('coverImg', coverFile);

      await axios.put(`${BACKEND_URL}/api/profile/update`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' // ফাইল পাঠানোর জন্য হেডার
        }
      });

      toast.success("Neural Identity Re-synced! ⚡");
      onUpdate(); 
      onClose();  
    } catch (err) {
      toast.error("Sync Failure: Database rejected input.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl font-mono"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-white hover:bg-zinc-900 p-2 rounded-full transition-colors">
              <HiXMark size={20} />
            </button>
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">Edit Identity</h3>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-white text-black px-6 py-1.5 rounded-full font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-50"
          >
            {loading ? "Syncing..." : "Save"}
          </button>
        </div>

        <form className="overflow-y-auto max-h-[80vh] custom-scrollbar">
          {/* Cover Image Upload */}
          <div className="relative h-32 bg-zinc-900 group">
            <img 
              src={coverFile ? URL.createObjectURL(coverFile) : (user?.coverImg || "https://via.placeholder.com/1000x300")} 
              className="w-full h-full object-cover opacity-60" 
              alt="cover" 
            />
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:bg-black/20 transition-all">
              <div className="bg-black/50 p-3 rounded-full border border-white/20 hover:scale-110 transition-transform">
                <FaCamera className="text-white" />
              </div>
              <input type="file" className="hidden" onChange={(e) => setCoverFile(e.target.files[0])} accept="image/*" />
            </label>
          </div>

          {/* Avatar Image Upload */}
          <div className="px-6 -mt-10 relative z-10">
            <div className="relative w-20 h-20 rounded-full border-4 border-black bg-zinc-900 overflow-hidden group">
              <img 
                src={avatarFile ? URL.createObjectURL(avatarFile) : (user?.avatar || user?.picture || "")} 
                className="w-full h-full object-cover" 
                alt="avatar" 
              />
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaCamera size={14} className="text-white" />
                <input type="file" className="hidden" onChange={(e) => setAvatarFile(e.target.files[0])} accept="image/*" />
              </label>
            </div>
          </div>

          {/* Input Fields */}
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Display Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 focus:border-cyan-500/50 outline-none transition-all text-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Neural Bio</label>
              <textarea 
                rows="3"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 focus:border-cyan-500/50 outline-none transition-all text-white text-sm resize-none"
                placeholder="Broadcast your status..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Location</label>
              <input 
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 focus:border-cyan-500/50 outline-none transition-all text-white text-sm"
                placeholder="Neo-City, Sector 7"
              />
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}