import React, { useState } from "react";
import { FaLock, FaClock, FaAtom } from "react-icons/fa";

const TimeVaultPicker = ({ onSelectTime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");

  const handleSetCapsule = () => {
    if (!deliveryDate) return;
    onSelectTime(deliveryDate);
    setIsOpen(false);
    alert(`🚀 Neural Link Locked until: ${new Date(deliveryDate).toLocaleDateString()}`);
  };

  return (
    <div className="relative">
      {/* মেইন বাটন */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded-full transition-all"
        title="Time Capsule"
      >
        <FaClock className={isOpen ? "animate-pulse" : ""} />
      </button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 w-72 bg-slate-900 border border-cyan-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-md z-50">
          <div className="flex items-center gap-2 mb-3 text-cyan-300 font-bold">
            <FaAtom className="animate-spin-slow" />
            <span>Neural Time-Vault</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            এটি আপনার মেসেজটি ভবিষ্যতে পাঠানোর জন্য লক করে দেবে। আগামী ১০০ বছর পর্যন্ত যেকোনো তারিখ বেছে নিন।
          </p>

          <input
            type="datetime-local"
            className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg mb-4 focus:outline-none focus:border-cyan-400"
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split(".")[0]}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 text-sm hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSetCapsule}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-cyan-900/20"
            >
              <FaLock className="text-xs" /> Lock in Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeVaultPicker;