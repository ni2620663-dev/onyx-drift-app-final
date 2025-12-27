import React from "react";
import logo from "../assets/images/logo.png";
import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth0 } from "@auth0/auth0-react"; 
import { FaHome, FaUserFriends, FaUsers, FaCalendarAlt, FaStore } from "react-icons/fa";

const Navbar = () => {
    const location = useLocation();
    const { isAuthenticated, user, logout, loginWithRedirect, isLoading } = useAuth0();

    const menuItems = [
        { path: "/feed", icon: <FaHome size={24} /> },
        { path: "/friends", icon: <FaUserFriends size={24} /> },
        { path: "/groups", icon: <FaUsers size={24} /> },
        { path: "/events", icon: <FaCalendarAlt size={24} /> },
        { path: "/marketplace", icon: <FaStore size={24} /> },
    ];

    if (isLoading) {
        return (
            <nav className="bg-gray-800 text-white p-4 flex justify-between items-center h-16">
                <div className="text-xl font-bold">OnyxDrift</div>
                <div className="animate-pulse">Loading...</div>
            </nav>
        );
    }
    
    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-4">
                <img src={logo} alt="Logo" className="h-8" onError={(e) => e.target.style.display='none'} />
                <h1 className="text-xl font-bold tracking-tight">OnyxDrift</h1>
            </div>

            {isAuthenticated && (
                <div className="flex items-center space-x-6">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                                location.pathname === item.path ? "bg-gray-700 text-blue-400" : ""
                            }`}
                        >
                            {item.icon}
                        </Link>
                    ))}
                </div>
            )}

            <div className="flex items-center">
                {isAuthenticated ? (
                    <ProfileDropdown 
                        user={{
                            ...user,
                            picture: user?.picture || "https://placehold.jp/150x150.png"
                        }} 
                        onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
                    />
                ) : (
                    <button 
                        onClick={() => loginWithRedirect()} 
                        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;