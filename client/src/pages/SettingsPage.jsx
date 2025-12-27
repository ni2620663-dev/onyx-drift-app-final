import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  FaUser, FaLock, FaBell, FaShieldAlt, FaTrashAlt, 
  FaChevronRight, FaMoon, FaSun, FaEye, FaGlobe 
} from 'react-icons/fa';

const SettingsPage = () => {
  const { user } = useAuth0();
  
  // ডার্ক মোড এবং অন্যান্য স্টেট
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [activeStatus, setActiveStatus] = useState(true);
  const [profilePrivate, setProfilePrivate] = useState(false);

  // ডার্ক মোড ইফেক্ট হ্যান্ডেল করা
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const sections = [
    {
      title: "Account Settings",
      items: [
        { id: 1, icon: <FaUser />, label: "Personal Information", desc: "Update your name and email", color: "bg-blue-100 text-blue-600" },
        { id: 2, icon: <FaLock />, label: "Password & Security", desc: "Change password and secure account", color: "bg-green-100 text-green-600" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { id: 3, icon: <FaBell />, label: "Notifications", desc: "Control your alert settings", color: "bg-yellow-100 text-yellow-600" },
        { id: 4, icon: <FaShieldAlt />, label: "Privacy Center", desc: "Manage your data and visibility", color: "bg-purple-100 text-purple-600" },
      ]
    }
  ];

  const handlePasswordReset = () => {
    alert("Auth0 এর মাধ্যমে আপনার ইমেইলে পাসওয়ার্ড পরিবর্তনের লিঙ্ক পাঠানো হবে।");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pt-20 pb-10 px-4`}>
      <div className="max-w-3xl mx-auto">
        
        {/* হেডার এবং ডার্ক মোড টগল */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings & Privacy</h1>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full shadow-lg transition-all transform active:scale-95 ${isDarkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>

        {/* প্রোফাইল কার্ড */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm p-6 mb-8 border flex items-center justify-between transition-all hover:shadow-md`}>
          <div className="flex items-center space-x-4">
            <img 
              src={user?.picture || "https://placehold.jp/150x150.png"} 
              alt="Profile" 
              className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5"
            />
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{user?.email}</p>
            </div>
          </div>
          <button className="text-blue-600 font-semibold hover:underline">Edit</button>
        </div>

        {/* কুইক সেটিংস (Toggles) */}
        <div className="mb-8 space-y-4">
          <h3 className="text-gray-500 uppercase text-xs font-bold tracking-wider px-2">Quick Controls</h3>
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
            
            <ToggleItem 
               icon={<FaEye />} 
               label="Active Status" 
               desc="Show when you are online" 
               color="bg-green-100 text-green-600" 
               checked={activeStatus} 
               onChange={() => setActiveStatus(!activeStatus)}
            />

            <ToggleItem 
               icon={<FaGlobe />} 
               label="Private Profile" 
               desc="Only friends can see your posts" 
               color="bg-purple-100 text-purple-600" 
               checked={profilePrivate} 
               onChange={() => setProfilePrivate(!profilePrivate)}
            />
          </div>
        </div>

        {/* মেনু সেকশন সমূহ */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-4 px-2">{section.title}</h3>
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
                {section.items.map((item) => (
                  <button 
                    key={item.id}
                    onClick={item.id === 2 ? handlePasswordReset : undefined}
                    className={`w-full flex items-center justify-between p-4 transition border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-50 hover:bg-gray-50'} last:border-0`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs opacity-60">{item.desc}</p>
                      </div>
                    </div>
                    <FaChevronRight className="opacity-30" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className={`mt-12 rounded-2xl p-6 border ${isDarkMode ? 'bg-red-900/20 border-red-900' : 'bg-red-50 border-red-100'}`}>
          <h3 className="text-red-600 font-bold mb-2 flex items-center">
            <FaTrashAlt className="mr-2" /> Danger Zone
          </h3>
          <p className="text-sm text-red-500 mb-4 opacity-80">অ্যাকাউন্ট ডিলিট করলে আপনার সব ডাটা চিরতরে মুছে যাবে।</p>
          <button className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200/50">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

// টগল কম্পোনেন্ট
const ToggleItem = ({ icon, label, desc, color, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-700/10 last:border-0">
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs opacity-60">{desc}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

export default SettingsPage;