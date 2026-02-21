import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);

  const [editData, setEditData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    avatar: user?.avatar || "",
    coverImg: user?.coverImg || ""
  });

  // Change detection (Save button enable/disable)
  const hasChanged = useMemo(() => {
    return JSON.stringify(editData) !== JSON.stringify({
      name: user?.name || "",
      bio: user?.bio || "",
      location: user?.location || "",
      website: user?.website || "",
      avatar: user?.avatar || "",
      coverImg: user?.coverImg || ""
    });
  }, [editData, user]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

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
      toast.success("Profile updated 🚀");
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-center items-start pt-10 px-4"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="bg-black w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <div className="flex items-center gap-6">
                <FaTimes
                  className="cursor-pointer"
                  onClick={onClose}
                />
                <h3 className="text-lg font-bold">Edit profile</h3>
              </div>

              <button
                onClick={handleSave}
                disabled={!hasChanged || isSaving}
                className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all ${
                  hasChanged
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* Cover */}
            <div
              className="relative h-40 bg-zinc-800 group cursor-pointer"
              onClick={() => coverInputRef.current.click()}
            >
              <img
                src={editData.coverImg}
                className="w-full h-full object-cover opacity-70"
                alt="cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <FaCamera className="text-white text-2xl" />
              </div>
              <input
                type="file"
                hidden
                ref={coverInputRef}
                onChange={(e) => handleImageChange(e, "coverImg")}
              />
            </div>

            {/* Avatar */}
            <div className="px-4 relative -mt-12 mb-6">
              <div
                className="w-28 h-28 rounded-full border-4 border-black overflow-hidden group cursor-pointer"
                onClick={() => avatarInputRef.current.click()}
              >
                <img
                  src={editData.avatar}
                  className="w-full h-full object-cover opacity-70"
                  alt="avatar"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-full">
                  <FaCamera className="text-white text-xl" />
                </div>
              </div>

              <input
                type="file"
                hidden
                ref={avatarInputRef}
                onChange={(e) => handleImageChange(e, "avatar")}
              />
            </div>

            {/* Form */}
            <div className="p-4 space-y-5">
              <div className="border border-zinc-800 rounded-md p-2">
                <label className="text-xs text-zinc-500">Name</label>
                <input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="bg-transparent w-full outline-none text-white pt-1"
                />
              </div>

              <div className="border border-zinc-800 rounded-md p-2">
                <label className="text-xs text-zinc-500">Bio</label>
                <textarea
                  maxLength={160}
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                  className="bg-transparent w-full outline-none text-white pt-1 h-24 resize-none"
                />
                <p className="text-right text-xs text-zinc-500">
                  {editData.bio.length}/160
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;