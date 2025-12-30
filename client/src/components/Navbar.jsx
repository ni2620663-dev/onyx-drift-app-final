import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { FaHome, FaUserFriends, FaFacebookMessenger, FaBell, FaTv, FaStore, FaBars } from "react-icons/fa";
import ProfileDropdown from "./ProfileDropdown";
import { toast } from "react-toastify";

const Navbar = ({ socket }) => {
  const { isAuthenticated, user } = useAuth0();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (socket?.current) {
      socket.current.on("getNotification", (data) => {
        setUnreadNotifications((prev) => prev + 1);
        
        // ফেসবুক স্টাইল কাস্টম নোটিফিকেশন
        toast.info(
          <div className="flex items-center gap-3">
            <img 
              src={data.image || "https://via.placeholder.com/40"} 
              alt="User" 
              className="w-10 h-10 rounded-full border border-gray-600"
            />
            <div>
              <p className="font-bold text-sm text-white">{data.senderName}</p>
              <p className="text-xs text-gray-300">
                {data.type === "friend_request" ? "Sent you a friend request" : "Interacted with your profile"}
              </p>
            </div>
          </div>,
          {
            icon: false, // ডিফল্ট আইকন বন্ধ রাখা হয়েছে কাস্টম ছবি ব্যবহারের জন্য
            style: { background: "#242526", borderRadius: "12px", border: "1px solid #3a3b3c" }
          }
        );
      });
    }
    return () => socket?.current?.off("getNotification");
  }, [socket]);

  useEffect(() => {
    if (location.pathname === "/notifications") {
      setUnreadNotifications(0);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: "/feed", icon: <FaHome size={24} /> },
    { path: "/friends", icon: <FaUserFriends size={26} /> },
    { path: "/messenger", icon: <FaFacebookMessenger size={22} /> },
    { 
      path: "/notifications", 
      icon: <FaBell size={22} />, 
      count: unreadNotifications 
    },
    { path: "/watch", icon: <FaTv size={22} /> },
    { path: "/marketplace", icon: <FaStore size={22} /> },
  ];

  return (
    <nav className="bg-[#242526] sticky top-0 z-[100] border-b border-gray-700 shadow-md w-full select-none">
      <div className="flex justify-between items-center px-4 py-2">
        <Link to="/" className="bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent text-2xl font-black tracking-tighter">
          OnyxDrift
        </Link>

        <div className="flex items-center space-x-3">
          <button className="p-2.5 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-full text-gray-200 transition">
            <FaBars size={18} />
          </button>
          {isAuthenticated && user && <ProfileDropdown user={user} />}
        </div>
      </div>

      <div className="flex justify-around items-center h-12 max-w-[600px] mx-auto">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 flex justify-center items-center h-full relative transition-all ${
                isActive ? "text-blue-500" : "text-gray-400 hover:bg-[#3a3b3c] rounded-lg mx-1"
              }`
            }
          >
            <div className="relative">
              {item.icon}
              {item.count > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 rounded-full border border-[#242526]">
                  {item.count}
                </span>
              )}
            </div>
            {location.pathname === item.path && (
              <div className="absolute bottom-0 w-full h-[3px] bg-blue-500 rounded-t-full"></div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;