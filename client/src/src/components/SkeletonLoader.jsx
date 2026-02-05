import React from "react";

const SkeletonLoader = () => {
  return (
    <div className="w-full max-w-[500px] bg-white rounded-xl shadow-sm p-4 mb-4 animate-pulse">
      {/* প্রোফাইল সেকশন স্কেলিটন */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>

      {/* টেক্সট সেকশন স্কেলিটন */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* ইমেজ সেকশন স্কেলিটন */}
      <div className="w-full h-64 bg-gray-200 rounded-lg"></div>
    </div>
  );
};

export default SkeletonLoader;