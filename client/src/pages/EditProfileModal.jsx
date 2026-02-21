import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);

  // Initial Data for comparison
  const initialData = useMemo(() => ({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    avatar: user?.avatar || user?.picture || "",
    coverImg: user?.coverImg || ""
  }), [user]);

  const [editData, setEditData] = useState(initialData);

  // Change detection
  const hasChanged = useMemo(() => {
    return JSON.stringify(editData) !== JSON.stringify(initialData);
  }, [editData, initialData]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return toast.error("Image must be under 2MB");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditData(prev => ({ ...prev, [type]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(editData);
      toast.success("Identity Updated 🚀");
      onClose();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex justify-center items-start pt-10 px-4 overflow-y-auto pb-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-black w-full max-w-lg rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/5 sticky top-0 bg-black/90 backdrop-blur-sm z-20">
              <div className="flex items-center gap-6">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <FaTimes className="text-white" />
                </button>
                <h3 className="text-lg font-black uppercase tracking-widest text-white/90">Edit Identity</h3>
              </div>

              <button
                onClick={handleSave}
                disabled={!hasChanged || isSaving}
                className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                  hasChanged && !isSaving
                    ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Syncing..." : "Save"}
              </button>
            </div>

            <div className="pb-6">
              {/* Cover Photo */}
              <div
                className="relative h-44 bg-zinc-900 group cursor-pointer overflow-hidden"
                onClick={() => coverInputRef.current.click()}
              >
                <img
                  src={editData.coverImg || "https://via.placeholder.com/1500x500?text=+"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt="cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/40 p-4 rounded-full backdrop-blur-md border border-white/20">
                    <FaCamera className="text-white text-xl" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={coverInputRef}
                  onChange={(e) => handleImageChange(e, "coverImg")}
                />
              </div>

              {/* Avatar Photo */}
              <div className="px-4 relative -mt-16 mb-8">
                <div
                  className="w-32 h-32 rounded-full border-4 border-black overflow-hidden group cursor-pointer relative bg-zinc-900 shadow-xl"
                  onClick={() => avatarInputRef.current.click()}
                >
                  <img
                    src={editData.avatar}
                    className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                    alt="avatar"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaCamera className="text-white text-2xl" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={avatarInputRef}
                  onChange={(e) => handleImageChange(e, "avatar")}
                />
              </div>

              {/* Form Fields */}
              <div className="px-6 space-y-5">
                {/* Name Input */}
                <div className="space-y-1 group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 ml-1">Full Name</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-cyan-500/50 transition-all">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="bg-transparent w-full outline-none text-white text-sm"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                {/* Bio Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 ml-1">Neural Bio</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-cyan-500/50 transition-all">
                    <textarea
                      maxLength={160}
                      rows={3}
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="bg-transparent w-full outline-none text-white text-sm resize-none"
                      placeholder="Tell the grid about yourself..."
                    />
                    <div className="text-right text-[10px] text-zinc-600 mt-1 font-mono">
                      {editData.bio.length}/160
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 ml-1">Location</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-cyan-500/50 transition-all">
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        className="bg-transparent w-full outline-none text-white text-sm"
                        placeholder="Neo-City"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 ml-1">Website</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-cyan-500/50 transition-all">
                      <input
                        type="text"
                        value={editData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        className="bg-transparent w-full outline-none text-white text-sm"
                        placeholder="link.tree/drifter"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;