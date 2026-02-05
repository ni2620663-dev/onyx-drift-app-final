import React, { useState } from "react";
import { FaTimes, FaCamera } from "react-icons/fa";

const EditProfileModal = ({ isOpen, onClose, currentProfile, onSave, saving }) => {
  const [formData, setFormData] = useState({ ...currentProfile });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <img 
                src={formData.avatar || "https://via.placeholder.com/100"} 
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                alt="Preview"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <FaCamera className="text-white text-xl" />
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click to change photo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              rows="3"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border dark:border-gray-600 rounded-xl font-bold dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:bg-blue-300"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;