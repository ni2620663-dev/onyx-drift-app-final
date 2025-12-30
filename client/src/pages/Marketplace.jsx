import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

const Marketplace = () => {
  const products = [
    { id: 1, title: "Samsung S24 Ultra", price: "25,000", loc: "Khustia", img: "https://via.placeholder.com/300" },
    { id: 2, title: "Winter Overcoat", price: "3500", loc: "Pabna", img: "https://via.placeholder.com/300" },
    { id: 3, title: "iPhone 15 Pro", price: "1,20,000", loc: "Dhaka", img: "https://via.placeholder.com/300" },
    { id: 4, title: "Pulsar NS 160", price: "1,50,000", loc: "Rajshahi", img: "https://via.placeholder.com/300" }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-white">Marketplace</h1>
        <div className="flex items-center gap-2 text-blue-500 font-bold bg-blue-500/10 px-4 py-2 rounded-full cursor-pointer">
          <FaMapMarkerAlt /> <span>Kushtia, Dhaka • 65 km</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(item => (
          <div key={item.id} className="bg-[#1c1c1c] rounded-[2.5rem] overflow-hidden border border-white/5 group hover:border-blue-500/40 transition-all">
            <div className="h-56 bg-gray-800 overflow-hidden">
               <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-5">
              <h3 className="text-xl font-black text-white">BDT {item.price}</h3>
              <p className="text-gray-400 font-bold text-sm mt-1">{item.title}</p>
              <p className="text-[10px] text-gray-500 font-black mt-2 uppercase">{item.loc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;