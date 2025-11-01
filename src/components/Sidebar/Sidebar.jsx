import React from "react";

export default function Navbar({ toggleDarkMode }) {
  return (
    <nav className="flex justify-between items-center p-4 bg-blue-600 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-10 h-10 bg-white text-blue-600 font-bold flex items-center justify-center rounded-full text-lg hover:scale-110 transition-transform">
          IB
        </div>
        <span className="text-white font-bold text-xl">My Social App</span>
      </div>

      {/* Dark mode button */}
      <button
        onClick={toggleDarkMode}
        className="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded"
      >
        Toggle Dark
      </button>
    </nav>
  );
}
