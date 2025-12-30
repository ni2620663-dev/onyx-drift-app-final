import React from "react";
import { FaSearch, FaEllipsisH, FaVideo, FaPlus } from "react-icons/fa"; // FaPlus ইম্পোর্ট করা হয়েছে

const RightSidebar = () => {
  // ডামি ফ্রেন্ড লিস্ট
  const contacts = [
    { id: 1, name: "Arif Ahmed", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arif", online: true },
    { id: 2, name: "Sumaiya Khan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sumaiya", online: true },
    { id: 3, name: "Rakib Hasan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakib", online: false },
    { id: 4, name: "Nusrat Jahan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nusrat", online: true },
    { id: 5, name: "Tanvir Isam", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvir", online: true },
  ];

  return (
    <div className="hidden xl:block w-[280px] sticky top-[110px] h-[calc(100vh-110px)] overflow-y-auto px-2 custom-scrollbar">
      {/* হেডার সেকশন */}
      <div className="flex justify-between items-center text-gray-400 mb-4 px-2">
        <h3 className="font-bold text-gray-400 text-[16px]">Contacts</h3>
        <div className="flex gap-4">
          <FaVideo className="cursor-pointer hover:text-gray-200" size={14} />
          <FaSearch className="cursor-pointer hover:text-gray-200" size={14} />
          <FaEllipsisH className="cursor-pointer hover:text-gray-200" size={14} />
        </div>
      </div>

      {/* কন্টাক্ট লিস্ট */}
      <div className="space-y-1">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-[#3a3b3c] rounded-xl cursor-pointer transition group">
            <div className="relative">
              <img 
                src={contact.img} 
                className="w-9 h-9 rounded-full object-cover border border-gray-700" 
                alt={contact.name} 
              />
              {contact.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#18191a] rounded-full"></div>
              )}
            </div>
            <span className="text-[15px] font-medium text-gray-300 group-hover:text-white transition">
              {contact.name}
            </span>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 my-4 mx-2"></div>
      
      <h3 className="font-bold text-gray-400 mb-2 px-2 text-[16px]">Group Conversations</h3>
      <div className="flex items-center gap-3 p-2 hover:bg-[#3a3b3c] rounded-xl cursor-pointer text-gray-300 group">
        <div className="bg-[#3a3b3c] p-2 rounded-full group-hover:bg-[#4e4f50] transition">
          <FaPlus size={14}/>
        </div>
        <span className="text-[15px] font-medium">Create New Group</span>
      </div>
    </div>
  );
};

export default RightSidebar;