import React from "react";
import logo from "../assets/images/logo.png";
import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth0 } from "@auth0/auth0-react"; 
import { FaHome, FaUserFriends, FaUsers, FaCalendarAlt, FaStore, FaSearch } from "react-icons/fa";

const Navbar = () => {
    const location = useLocation();
    const { isAuthenticated, user, logout, loginWithRedirect, isLoading } = useAuth0();

    const menuItems = [
        { path: "/feed", icon: <FaHome size={22} />, label: "Home" },
        { path: "/friends", icon: <FaUserFriends size={22} />, label: "Friends" },
        { path: "/groups", icon: <FaUsers size={22} />, label: "Groups" },
        { path: "/events", icon: <FaCalendarAlt size={22} />, label: "Events" },
        { path: "/marketplace", icon: <FaStore size={22} />, label: "Store" },
       <NavLink to="/messenger" className={({ isActive }) => isActive ? "font-bold border-b-2" : ""}>Chat</NavLink> 
    ];

    if (isLoading) {
        return (
            <nav className="bg-gray-800 text-white h-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </nav>
        );
    }
    
    return (
        <nav className="bg-white text-gray-800 h-16 px-4 flex justify-between items-center shadow-sm sticky top-0 z-50 border-b border-gray-200">
            
            {/* বাম পাশ: Logo and Search */}
            <div className="flex items-center space-x-3">
                <Link to="/">
                    <img src={logo} alt="Logo" className="h-10 w-10" onError={(e) => e.target.style.display='none'} />
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

            {/* মাঝখান: Navigation Icons (শুধুমাত্র লগইন থাকলে) */}
            {isAuthenticated && (
                <div className="flex items-center space-x-2 md:space-x-8">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            title={item.label}
                            className={`p-3 rounded-xl transition-all duration-200 group relative ${
                                location.pathname === item.path 
                                ? "text-blue-600 bg-blue-50" 
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                            {item.icon}
                            {location.pathname === item.path && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>
                            )}
                        </Link>
                    ))}
                </div>
            )}

            {/* ডান পাশ: Profile and Logout */}
            <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                    <div className="flex items-center space-x-2">
                        <span className="hidden lg:block font-medium text-sm text-gray-700">Hi, {user?.given_name || user?.nickname}</span>
                        <ProfileDropdown 
                            user={{
                                ...user,
                                picture: user?.picture || "https://placehold.jp/150x150.png"
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