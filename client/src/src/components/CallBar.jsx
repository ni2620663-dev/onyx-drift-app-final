import React from "react";
import { FaVideo, FaPhone } from "react-icons/fa";

const CallBar = () => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-6 bg-gray-800 p-4 rounded-full shadow-lg">
      
      {/* Video Call Button */}
      <button className="bg-blue-500 hover:bg-blue-600 p-4 rounded-full text-white flex items-center justify-center shadow-md transition-all duration-200">
        <FaVideo size={24} />
      </button>

      {/* Audio Call Button */}
      <button className="bg-green-500 hover:bg-green-600 p-4 rounded-full text-white flex items-center justify-center shadow-md transition-all duration-200">
        <FaPhone size={24} />
      </button>

    </div>
  );
};

export default CallBar;
