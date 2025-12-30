import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { 
  FaUserCircle, FaShieldAlt, FaBell, FaMoon, FaSignOutAlt, 
  FaChevronRight, FaEdit, FaCheck, FaArrowLeft, FaLock, FaKey, FaCamera, FaSpinner 
} from 'react-icons/fa';
import { useUser } from '../context/UserContext'; 

const Settings = () => {
  const { user, logout, isAuthenticated } = useAuth0();
  // userData যদি লোড না হয় তবে ব্যাকআপ হিসেবে user ব্যবহার করবে
  const { userData, updateGlobalProfile, loading } = useUser() || {};
  
  const [activeTab, setActiveTab] = useState("main");
  const [uploading, setUploading] = useState(false);
  
  // প্রোফাইল ডাটা হ্যান্ডেল করার জন্য স্টেট
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    phone: ""
  });

  // ডাটাবেস বা Auth0 থেকে ডাটা আসলে প্রোফাইল আপডেট হবে
  useEffect(() => {
    if (userData || user) {
      setProfile({
        name: userData?.name || user?.name || "User",
        username: userData?.username || user?.nickname || "username",
        phone: userData?.phone || "+880 1XXX-XXXXXX"
      });
    }
  }, [userData, user]);

  // ডাটাবেসে তথ্য সেভ করা
  const handleSaveInDB = async (field, newVal) => {
    const fieldKey = field.toLowerCase();
    const updatedData = { ...profile, [fieldKey]: newVal, auth0Id: user?.sub };
    
    try {
      const res = await axios.post("http://localhost:10000/api/user/update", updatedData);
      if(res.status === 200) {
        setProfile(updatedData);
        if (updateGlobalProfile) updateGlobalProfile(updatedData);
        alert(`${field} আপডেট হয়েছে!`);
      }
    } catch (err) {
      console.error(err);
      alert("ডাটাবেসে সেভ করতে সমস্যা হয়েছে।");
    }
  };

  // ছবি আপলোড করা
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "onyx_upload"); 

    try {
      setUploading(true);
      const res = await axios.post("https://api.cloudinary.com/v1_1/dx0cf0ggu/image/upload", formData);
      const imageUrl = res.data.secure_url;

      await axios.post("http://localhost:10000/api/user/update-picture", {
        auth0Id: user?.sub,
        pictureUrl: imageUrl
      });

      if (updateGlobalProfile) updateGlobalProfile({ picture: imageUrl });
      alert("ছবি পরিবর্তন হয়েছে!");
    } catch (err) {
      alert("আপলোড ব্যর্থ হয়েছে!");
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) return <div className="text-white p-10">Please Login First</div>;

  const MainMenu = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-black mb-8 text-white uppercase tracking-tighter">Settings</h1>
      
      {/* Account Center Card */}
      <div className="bg-[#1c1c1c] rounded-3xl p-6 border border-white/5 shadow-xl mb-6 cursor-pointer hover:bg-[#252525] transition" onClick={() => setActiveTab("personal")}>
        <p className="text-blue-500 text-[10px] font-black uppercase mb-2">Meta Account Center</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={userData?.picture || user?.picture} 
                className="w-14 h-14 rounded-full border-2 border-blue-600 object-cover p-0.5 bg-black" 
                alt="Profile" 
              />
              <label className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-blue-700">
                {uploading ? <FaSpinner className="animate-spin text-white text-[10px]" /> : <FaCamera className="text-white text-[10px]" />}
                <input type="file" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h3 className="font-bold text-white">{profile.name}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Personal details • Password</p>
            </div>
          </div>
          <FaChevronRight className="text-gray-600" />
        </div>
      </div>

      <div className="bg-[#1c1c1c] rounded-[2rem] overflow-hidden border border-white/5 shadow-lg">
        <SettingItem icon={<FaShieldAlt color="#10b981" />} title="Security and Login" desc="Change password & secure account" onClick={() => setActiveTab("security")} />
        <SettingItem icon={<FaBell color="#f43f5e" />} title="Notifications" desc="Manage your alerts" />
        <SettingItem icon={<FaMoon color="#a855f7" />} title="Dark Mode" desc="Adjust look and feel" />
      </div>

      <button onClick={() => logout()} className="w-full bg-red-500/10 text-red-500 p-5 rounded-3xl font-black text-xs uppercase border border-red-500/20 mt-6 hover:bg-red-500/20 transition">
        <FaSignOutAlt className="inline mr-2" /> Log Out from Onyx Drift
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#e4e6eb] pt-24 pb-20 px-4 w-full">
      <div className="max-w-[700px] mx-auto">
        {activeTab === "main" && <MainMenu />}
        {activeTab === "personal" && (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveTab("main")} className="flex items-center gap-2 text-blue-500 font-bold mb-6 hover:underline">
              <FaArrowLeft /> Back to Settings
            </button>
            <h2 className="text-2xl font-black mb-6 text-white">Personal Information</h2>
            <div className="bg-[#1c1c1c] rounded-3xl p-8 border border-white/5 space-y-6 shadow-2xl">
              <EditableField label="Name" value={profile.name} onSave={(val) => handleSaveInDB("Name", val)} />
              <EditableField label="Username" value={profile.username} onSave={(val) => handleSaveInDB("Username", val)} />
              <EditableField label="Phone" value={profile.phone} onSave={(val) => handleSaveInDB("Phone", val)} />
            </div>
          </div>
        )}
        {activeTab === "security" && (
            <div className="animate-in slide-in-from-right duration-300">
                <button onClick={() => setActiveTab("main")} className="flex items-center gap-2 text-blue-500 font-bold mb-6 hover:underline"><FaArrowLeft /> Back</button>
                <h2 className="text-2xl font-black mb-6 text-white">Security & Login</h2>
                <div className="bg-[#1c1c1c] rounded-3xl p-4 border border-white/5 space-y-2 shadow-xl">
                    <SettingItem icon={<FaKey className="text-yellow-500" />} title="Change Password" desc="Request a password reset link" onClick={() => alert("Link sent!")} />
                    <SettingItem icon={<FaLock className="text-blue-500" />} title="2FA" desc="Two-factor authentication settings" />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// হেল্পার কম্পোনেন্ট: সেটিংস আইটেম
const SettingItem = ({ icon, title, desc, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition border-b border-white/5 last:border-0 group">
    <div className="flex items-center gap-4">
      <div className="text-xl bg-white/5 p-3 rounded-xl">{icon}</div>
      <div className="text-left">
        <p className="font-bold text-sm text-white">{title}</p>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{desc}</p>
      </div>
    </div>
    <FaChevronRight className="text-gray-700 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
  </button>
);

// হেল্পার কম্পোনেন্ট: এডিটেবল ফিল্ড
const EditableField = ({ label, value, onSave, disabled = false }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [tempVal, setTempVal] = useState(value);

  // value আপডেট হলে tempVal ও আপডেট হবে
  useEffect(() => { setTempVal(value); }, [value]);

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{label}</p>
        {isEdit ? (
          <input 
            className="bg-black/60 border border-blue-600 rounded-lg px-3 py-1.5 mt-1 text-white outline-none w-full max-w-[300px] text-sm" 
            value={tempVal} 
            onChange={(e) => setTempVal(e.target.value)} 
            autoFocus 
          />
        ) : (
          <p className="font-bold text-gray-200 text-sm mt-1">{value || "Not set"}</p>
        )}
      </div>
      {!disabled && (
        isEdit ? (
          <button onClick={() => { onSave(tempVal); setIsEdit(false); }} className="bg-blue-600 text-white p-2 rounded-lg ml-2"><FaCheck className="text-xs" /></button>
        ) : (
          <button onClick={() => setIsEdit(true)} className="text-blue-500 font-black text-[10px] uppercase hover:bg-blue-500/10 px-3 py-1 rounded-full transition">Edit</button>
        )
      )}
    </div>
  );
};

export default Settings;