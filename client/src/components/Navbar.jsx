import React from "react";
import logo from "../assets/images/logo.png";
import { Link, useLocation, NavLink } from "react-router-dom"; // NavLink যোগ করা হয়েছে
import ProfileDropdown from "./ProfileDropdown";
import { useAuth0 } from "@auth0/auth0-react"; 
import { FaHome, FaUserFriends, FaUsers, FaCalendarAlt, FaStore, FaSearch, FaCommentDots } from "react-icons/fa";

const Navbar = () => {
    const location = useLocation();
    const { isAuthenticated, user, logout, loginWithRedirect, isLoading } = useAuth0();

    // নেভিগেশন আইটেমগুলো এখানে সাজানো
    const menuItems = [
        { path: "/feed", icon: <FaHome size={22} />, label: "Home" },
        { path: "/friends", icon: <FaUserFriends size={22} />, label: "Friends" },
        { path: "/messenger", icon: <FaCommentDots size={22} />, label: "Messages" }, // চ্যাট এখানে যোগ করা হয়েছে
        { path: "/groups", icon: <FaUsers size={22} />, label: "Groups" },
        { path: "/marketplace", icon: <FaStore size={22} />, label: "Store" },
    ];

    // ডিফল্ট ইমেজ লিঙ্ক (যদি মেইন ইমেজ কাজ না করে)
    const fallbackImage = "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky";

    if (isLoading) {
        return (
            <nav className="bg-white border-b h-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </nav>
        );
    }
    
    return (
        <nav className="bg-white text-gray-800 h-16 px-4 flex justify-between items-center shadow-sm sticky top-0 z-50 border-b border-gray-200">
            
            {/* বাম পাশ: Logo and Search */}
            <div className="flex items-center space-x-3">
                <Link to="/">
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="h-10 w-10 object-contain" 
                        onError={(e) => { e.target.style.display='none' }} 
                    />
                </Link>
                <div className="hidden md:flex items-center bg-gray-100 px-3 py-2 rounded-full">
                    <FaSearch className="text-gray-500 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Search OnyxDrift" 
                        className="bg-transparent border-none focus:outline-none text-sm w-48"
                    />
                </div>
            </div>

            {/* মাঝখান: Navigation Icons */}
            {isAuthenticated && (
                <div className="flex items-center space-x-1 md:space-x-4">
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            title={item.label}
                            className={({ isActive }) => `
                                p-3 rounded-xl transition-all duration-200 group relative
                                ${isActive 
                                    ? "text-blue-600 bg-blue-50" 
                                    : "text-gray-500 hover:bg-gray-100"
                                }
                            `}
                        >
                            {item.icon}
                            {location.pathname === item.path && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>
                            )}
                        </NavLink>
                    ))}
                </div>
            )}

            {/* ডান পাশ: Profile and Logout */}
            <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                    <div className="flex items-center space-x-2">
                        <span className="hidden lg:block font-medium text-sm text-gray-700">
                            Hi, {user?.given_name || user?.nickname || "User"}
                        </span>
                        
                        {/* প্রোফাইল ড্রপডাউন এবং ইমেজ হ্যান্ডলিং */}
                        <ProfileDropdown 
                            user={{
                                ...user,
                                picture: user?.picture || fallbackImage
                            }} 
                            onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
                        />
                    </div>
                ) : (
                    <button 
                        onClick={() => loginWithRedirect()} 
                        className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-bold shadow-md shadow-blue-200"
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;