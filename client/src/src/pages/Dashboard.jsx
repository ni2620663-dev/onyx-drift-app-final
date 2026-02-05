import React from "react";
import { HiOutlineArrowTrendingUp, HiOutlineUsers, HiOutlineChatBubbleLeft } from "react-icons/hi2";

const Dashboard = () => {
  const stats = [
    { id: 1, label: "Total Reach", value: "12.4K", icon: <HiOutlineArrowTrendingUp />, color: "text-blue-500" },
    { id: 2, label: "Friends", value: "842", icon: <HiOutlineUsers />, color: "text-purple-500" },
    { id: 3, label: "Messages", value: "+45", icon: <HiOutlineChatBubbleLeft />, color: "text-green-500" },
  ];

  return (
    <div className="max-w-4xl mx-auto pt-8 px-6 space-y-8">
      <h1 className="text-3xl font-black text-gray-800 tracking-tight">Dashboard</h1>
      
      {/* স্ট্যাটস গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="glass p-6 rounded-[35px] border border-white shadow-sm hover:shadow-md transition">
            <div className={`text-3xl mb-4 ${stat.color}`}>{stat.icon}</div>
            <h3 className="text-3xl font-black text-gray-800">{stat.value}</h3>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* রিসেন্ট অ্যাক্টিভিটি কার্ড */}
      <div className="glass p-8 rounded-[40px] border border-white">
        <h4 className="font-black text-xl mb-6 text-gray-800">Recent Activity</h4>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-100 w-1/3 rounded-full mb-2"></div>
                <div className="h-3 bg-gray-50 w-1/2 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;