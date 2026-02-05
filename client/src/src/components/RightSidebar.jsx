import React from "react";
import { FaSearch, FaEllipsisH, FaVideo, FaPlus } from "react-icons/fa";

const RightSidebar = () => {
  const contacts = [
    { id: 1, name: "Arif Ahmed", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arif", online: true },
    { id: 2, name: "Sumaiya Khan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sumaiya", online: true },
    { id: 5, name: "Tanvir Islam", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvir", online: true },
  ];

  return (
    // এখানে কোনো 'fixed' ব্যবহার করবেন না, শুধু 'h-full'
    <div className="w-full h-full overflow-y-auto no-scrollbar py-4 px-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">Contacts</h3>
        <div className="flex gap-3 text-slate-500">
           <FaVideo size={14} className="hover:text-sky-400 cursor-pointer" />
           <FaSearch size={14} className="hover:text-sky-400 cursor-pointer" />
           <FaEllipsisH size={14} className="hover:text-sky-400 cursor-pointer" />
        </div>
      </div>

      <div className="space-y-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-2xl cursor-pointer transition-all group">
            <div className="relative">
              <img src={contact.img} className="w-10 h-10 rounded-full border-2 border-sky-500/20" alt="" />
              {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#020617] rounded-full"></div>}
            </div>
            <span className="text-sm font-bold text-slate-300 group-hover:text-white">{contact.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightSidebar;