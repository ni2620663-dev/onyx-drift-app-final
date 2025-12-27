import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaCog, FaSignOutAlt, FaShieldAlt, FaQuestionCircle } from "react-icons/fa";

const ProfileDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ড্রপডাউনের বাইরে ক্লিক করলে সেটি বন্ধ করার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* প্রোফাইল ইমেজ বাটন */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none"
      >
        <img
          className="h-10 w-10 rounded-full border-2 border-blue-500 object-cover p-0.5 hover:opacity-90 transition"
          src={user?.picture || "https://placehold.jp/150x150.png"}
          alt="User Profile"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.jp/150x150.png";
          }}
        />
      </button>

      {/* ড্রপডাউন মেনু */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
          
          {/* ইউজার ইনফো সেকশন */}
          <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center p-4 mx-2 rounded-xl hover:bg-gray-50 transition">
            <img
              className="h-12 w-12 rounded-full object-cover"
              src={user?.picture || "https://placehold.jp/150x150.png"}
              alt="Profile"
            />
            <div className="ml-3">
              <p className="text-sm font-bold text-gray-900">{user?.name || user?.nickname}</p>
              <p className="text-xs text-gray-500">See your profile</p>
            </div>
          </Link>

          <hr className="my-2 border-gray-100" />

          {/* মেনু আইটেমসমূহ */}
          <div className="px-2 space-y-1">
            <MenuLink to="/settings" icon={<FaCog />} label="Settings & Privacy" onClick={() => setIsOpen(false)} />
            <MenuLink to="/help" icon={<FaQuestionCircle />} label="Help & Support" onClick={() => setIsOpen(false)} />
            <MenuLink to="/security" icon={<FaShieldAlt />} label="Security Center" onClick={() => setIsOpen(false)} />
            
            {/* লগআউট বাটন */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center p-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
            >
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <FaSignOutAlt size={16} />
              </div>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ছোট হেল্পার কম্পোনেন্ট মেনু লিঙ্কগুলোর জন্য
const MenuLink = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition font-medium"
  >
    <div className="bg-gray-200 p-2 rounded-full mr-3 text-gray-600">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    {label}
  </Link>
);

export default ProfileDropdown;