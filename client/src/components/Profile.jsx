import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { 
  FaCamera, FaSave, FaUser, FaEnvelope, 
  FaMapMarkerAlt, FaCalendarAlt, FaTimes, FaEdit, FaUserCircle 
} from "react-icons/fa";

// ডিফল্ট ইমেজ লিঙ্ক (এটি অনেক স্ট্যাবল)
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky";

// ==========================================
// ১. এডিট প্রোফাইল মডাল কম্পোনেন্ট
// ==========================================
const EditProfileModal = ({ isOpen, onClose, currentProfile, onSave, saving }) => {
  const [formData, setFormData] = useState({ ...currentProfile });

  useEffect(() => {
    if (isOpen) setFormData({ ...currentProfile });
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <img 
                src={formData.avatar || DEFAULT_AVATAR} 
                onError={(e) => { e.target.src = DEFAULT_AVATAR }}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
                alt="Preview"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <FaCamera className="text-white text-xl" />
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Update Profile Picture</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              rows="3"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <div className="p-6 border-t dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold dark:text-white hover:bg-gray-50 transition">
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg disabled:bg-blue-300"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ২. মেইন প্রোফাইল কম্পোনেন্ট
// ==========================================
const Profile = () => {
  const { user, isLoading, isAuthenticated } = useAuth0();
  const userId = user?.sub;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: "",
    bio: "Software Engineer & Tech Enthusiast",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;

    axios.get(`${API_URL}/api/profile/${encodeURIComponent(userId)}`)
      .then((res) => {
        setProfile({
          name: res.data.name || user?.name || "User Name",
          email: res.data.email || user?.email || "",
          avatar: res.data.avatar || user?.picture || DEFAULT_AVATAR,
          bio: res.data.bio || "Available",
        });
      })
      .catch((err) => {
        console.error("❌ Profile fetch error:", err);
        // যদি ডাটাবেসে ইউজার না থাকে তবে Auth0 এর ডাটা সেট করা
        setProfile(prev => ({
          ...prev,
          name: user?.name || "",
          email: user?.email || "",
          avatar: user?.picture || DEFAULT_AVATAR
        }));
      });
  }, [userId, API_URL, user]);

  const handleUpdateSave = async (updatedData) => {
    if (!userId) return;
    try {
      setSaving(true);
      const res = await axios.put(
        `${API_URL}/api/profile/${encodeURIComponent(userId)}`,
        updatedData
      );
      setProfile(prev => ({ ...prev, ...res.data }));
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen font-bold dark:text-white">Loading...</div>;
  if (!isAuthenticated) return <div className="text-center mt-20 text-red-500 font-bold">Please log in to view profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-10">
      
      {/* Cover Photo */}
      <div className="h-56 md:h-80 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              
              {/* Profile Image with Fallback */}
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    onError={(e) => { e.target.src = DEFAULT_AVATAR }}
                    alt="Avatar"
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-8 border-white dark:border-gray-800 shadow-2xl transition hover:scale-105"
                  />
                ) : (
                  <FaUserCircle className="w-40 h-40 md:w-48 md:h-48 text-gray-300 bg-white rounded-full border-8 border-white" />
                )}
                <div className="absolute bottom-4 right-6 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"></div>
              </div>

              <div className="flex-1 text-center md:text-left mb-4">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  {profile.name}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium max-w-md mx-auto md:mx-0">
                  {profile.bio}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-5 mt-6 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FaEnvelope className="text-blue-500" /> {profile.email}
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FaMapMarkerAlt className="text-red-500" /> Dhaka, BD
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition transform active:scale-95 shadow-xl shadow-blue-200 dark:shadow-none"
              >
                <FaEdit /> Edit Profile
              </button>
            </div>

            <hr className="my-10 border-gray-100 dark:border-gray-700" />

            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50/50 dark:bg-gray-700/40 p-6 rounded-3xl border border-blue-100 dark:border-gray-700 text-center">
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">1.2k</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Followers</p>
              </div>
              <div className="bg-purple-50/50 dark:bg-gray-700/40 p-6 rounded-3xl border border-purple-100 dark:border-gray-700 text-center">
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400">450</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Following</p>
              </div>
              <div className="bg-indigo-50/50 dark:bg-gray-700/40 p-6 rounded-3xl border border-indigo-100 dark:border-gray-700 text-center">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">84</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Posts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        currentProfile={profile}
        onSave={handleUpdateSave}
        saving={saving}
      />
    </div>
  );
};

export default Profile;