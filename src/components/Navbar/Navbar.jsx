import React from "react";
import Logo from "../../assets/images/logo.png"; // logo path

export default function Navbar({ toggleDarkMode }) {
  return (
    <nav className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-4">
        <img
          src={Logo}
          alt="Logo"
          className="w-10 h-10 object-contain hover:scale-110 transition-transform"
        />
        <input
          type="text"
          placeholder="Search..."
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Center: FB-style icons */}
      <div className="flex items-center gap-6 text-gray-700 dark:text-gray-200">
        <span className="text-2xl cursor-pointer hover:text-blue-500 hover:scale-110 transition-transform transition-colors" title="Home">🏠</span>
        <span className="text-2xl cursor-pointer hover:text-green-500 hover:scale-110 transition-transform transition-colors" title="Messages">💬</span>
        <span className="text-2xl cursor-pointer hover:text-red-500 hover:scale-110 transition-transform transition-colors" title="Notifications">🔔</span>
        <span className="text-2xl cursor-pointer hover:text-purple-500 hover:scale-110 transition-transform transition-colors" title="Profile">👤</span>
      </div>

      {/* Right: Dark mode toggle + user avatar */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={toggleDarkMode}
        >
          Toggle Theme
        </button>
        <div className="w-10 h-10 bg-gray-400 rounded-full cursor-pointer hover:scale-110 transition-transform"></div>
      </div>
    </nav>
  );
}
