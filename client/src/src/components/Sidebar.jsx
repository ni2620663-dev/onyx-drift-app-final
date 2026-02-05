import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome, FaEnvelope, FaCompass, FaCog, FaSignOutAlt, FaRocket, FaUserPlus, FaFire
} from 'react-icons/fa'; 
import { HiOutlineChartBar } from 'react-icons/hi2';
import { useAuth0 } from '@auth0/auth0-react'; // টাইপো ফিক্স করা হয়েছে

const Sidebar = () => {
  const { logout } = useAuth0();

  const menuItems = [
    { name: 'Feed', icon: <FaHome />, path: '/feed' },
    { name: 'For You', icon: <FaFire />, path: '/reels' },
    { name: 'Following', icon: <FaUserPlus />, path: '/following' }, 
    { name: 'Analytics', icon: <HiOutlineChartBar />, path: '/analytics' },
    { name: 'Messages', icon: <FaEnvelope />, path: '/messages' },
    { name: 'Explore', icon: <FaCompass />, path: '/explorer' },
    { name: 'Settings', icon: <FaCog />, path: '/settings' },
  ];

  return (
    <div className="flex flex-col h-full py-6 justify-between bg-black/50 backdrop-blur-xl border-r border-white/5">
      
      {/* ১. মেইন নেভিগেশন */}
      <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-6 mb-6 italic opacity-50">
          Neural Menu
        </p>
        
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-6 py-4 transition-all duration-300 group
              ${isActive
                ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-[3px] border-cyan-500 shadow-[20px_0_30px_-15px_rgba(34,211,238,0.1)]'
                : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'}
            `}
          >
            <span className="text-xl group-hover:scale-110 transition-transform duration-300">
              {item.icon}
            </span>
            <span className="text-[13px] font-bold tracking-wide uppercase italic">
              {item.name}
            </span>
          </NavLink>
        ))}
      </div>

      {/* ২. প্রো কার্ড এবং লগআউট */}
      <div className="px-4 mt-auto space-y-4">
        
        {/* Onyx Pro Card */}
        <div className="bg-gradient-to-br from-[#111] to-black rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-2 opacity-5 group-hover:opacity-20 transition-all duration-700">
             <FaRocket size={80} className="text-cyan-400 -rotate-12" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-1 italic">
              Onyx Pro
            </p>
            <p className="text-[11px] font-bold text-gray-400 mb-4 leading-tight">
              Access neural filters & advanced stats.
            </p>
            
            <button className="w-full bg-cyan-500/10 hover:bg-cyan-500 text-cyan-500 hover:text-black py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 border border-cyan-500/20">
              Upgrade
            </button>
          </div>
        </div>

        {/* Disconnect Button */}
        <button 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="w-full flex items-center gap-4 px-6 py-4 text-gray-600 hover:text-rose-500 transition-all duration-300 font-bold text-[11px] uppercase italic group"
        >
          <FaSignOutAlt size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Disconnect</span>
        </button>

      </div>
    </div>
  );
};

export default Sidebar;