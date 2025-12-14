// src/components/Navbar.jsx

import React from "react";
import logo from "../assets/images/logo.png";
import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
// Auth0 হুক ইম্পোর্ট করা হলো
import { useAuth0 } from "@auth0/auth0-react"; 
import {
    FaHome,
    FaUserFriends,
    FaUsers,
    FaCalendarAlt,
    FaStore,
} from "react-icons/fa";

// Note: এই কম্পোনেন্টে এখন আর 'user' বা 'onLogout' props দরকার নেই, কারণ সবকিছু Auth0 হুক থেকে আসবে।
const Navbar = () => {
    const location = useLocation();
    
    // Auth0 হুক থেকে প্রয়োজনীয় ফাংশন এবং অবস্থাগুলি নিন
    const { 
        isAuthenticated, 
        user, 
        logout, 
        loginWithRedirect,
        isLoading // লোডিং অবস্থাটিও জেনে রাখা ভালো
    } = useAuth0();

    const menuItems = [
        { path: "/feed", icon: <FaHome size={24} /> }, // হোমের পরিবর্তে /feed ব্যবহার করা যেতে পারে
        { path: "/friends", icon: <FaUserFriends size={24} /> },
        { path: "/groups", icon: <FaUsers size={24} /> },
        { path: "/events", icon: <FaCalendarAlt size={24} /> },
        { path: "/marketplace", icon: <FaStore size={24} /> },
    ];

    // Auth0 লোড হওয়ার সময় বাটনটি লুকানো
    if (isLoading) {
        return (
            <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold">OnyxDrift Social App</h1>
                </div>
                <div>Loading...</div>
            </nav>
        );
    }
    
    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
            {/* Logo and App Name */}
            <div className="flex items-center space-x-4">
                <img src={logo} alt="Logo" className="h-8" />
                <h1 className="text-xl font-bold">OnyxDrift</h1>
            </div>

            {/* Icon-only menu (শুধুমাত্র লগইন করা থাকলে দেখাবে) */}
            {isAuthenticated && (
                <div className="flex items-center space-x-6">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                                location.pathname === item.path ? "bg-gray-700" : ""
                            }`}
                        >
                            {item.icon}
                        </Link>
                    ))}
                </div>
            )}

            {/* Profile Dropdown বা Login বাটন */}
            {isAuthenticated ? (
                // লগইন করা থাকলে: প্রোফাইল ড্রপডাউন দেখান
                <ProfileDropdown 
                    user={user} 
                    onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
                />
            ) : (
                // লগইন করা না থাকলে: সরাসরি Auth0-তে রিডাইরেক্ট করার বাটন
                <div className="text-white">
                    <button 
                        onClick={() => loginWithRedirect()} // <== এটিই আপনার প্রয়োজনীয় Auth0 কল
                        className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 transition"
                    >
                        Login
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;