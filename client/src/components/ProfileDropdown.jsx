import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react"; // Auth0 ইমপোর্ট যোগ করা হয়েছে
import { FaCog, FaSignOutAlt, FaQuestionCircle, FaChevronRight } from "react-icons/fa";

const ProfileDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useAuth0(); // সরাসরি এখান থেকেই লগআউট ফাংশন নেওয়া হচ্ছে

  // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হওয়ার লজিক
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
      {/* প্রোফাইল বাটন */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="focus:outline-none flex items-center"
      >
        <img
          className={`h-9 w-9 rounded-full object-cover border-2 transition-all duration-200 ${
            isOpen ? "border-blue-500 scale-105" : "border-gray-700 hover:border-gray-500"
          }`}
          src={user?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
          alt="User"
        />
      </button>

      {/* ড্রপডাউন মেনু */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-[#242526] rounded-2xl shadow-2xl border border-white/10 py-3 z-[100] transform origin-top-right animate-in fade-in zoom-in duration-200">
          
          {/* প্রোফাইল লিংক সেকশন */}
          <Link 
            to="/profile" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 mb-2 mx-2 bg-white/5 rounded-xl hover:bg-white/10 transition"
          >
            <div className="flex items-center gap-3">
               <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={user?.picture}
                  alt=""
               />
               <div>
                  <p className="text-[16px] font-bold text-white leading-tight">
                    {user?.name || "User Name"}
                  </p>
                  <p className="text-xs text-blue-400 font-medium mt-1">
                    See your profile
                  </p>
               </div>
            </div>
          </Link>

          <div className="border-b border-white/10 my-2 mx-4"></div>

          {/* মেনু আইটেমসমূহ */}
          <div className="px-2 space-y-1">
            <MenuLink 
                to="/settings" 
                icon={<FaCog />} 
                label="Settings & Privacy" 
                onClick={() => setIsOpen(false)} 
            />
            <MenuLink 
                to="/help" 
                icon={<FaQuestionCircle />} 
                label="Help & Support" 
                onClick={() => setIsOpen(false)} 
            />
            
            {/* লগআউট বাটন */}
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="w-full flex items-center justify-between p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition group"
            >
              <div className="flex items-center">
                <div className="bg-red-500/10 p-2 rounded-full mr-3 text-red-500 group-hover:bg-red-500/20">
                  <FaSignOutAlt size={16} />
                </div>
                <span className="text-[15px] font-bold">Log Out</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// সাব-কম্পোনেন্ট: মেনু লিংক
const MenuLink = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center justify-between p-3 rounded-xl text-gray-300 hover:bg-white/5 transition group"
  >
    <div className="flex items-center">
      <div className="bg-white/10 p-2 rounded-full mr-3 text-gray-300 group-hover:bg-white/20">
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <span className="text-[15px] font-bold">{label}</span>
    </div>
    <FaChevronRight size={12} className="text-gray-600 group-hover:text-gray-400" />
  </Link>
);

export default ProfileDropdown;