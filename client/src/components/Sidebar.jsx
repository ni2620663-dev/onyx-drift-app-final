import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome, FaEnvelope, FaCompass, FaCog, FaSignOutAlt, FaRocket, FaUserPlus, FaFire
} from 'react-icons/fa'; 
import { HiOutlineChartBar } from 'react-icons/hi2';
import { useAuth0 } from '@auth0/auth0-react';

const Sidebar = () => {
  const { logout, user } = useAuth0(); // ইউজার আইডি প্রোফাইল লিঙ্কের জন্য লাগবে

  const menuItems = [
    { name: 'Feed', icon: <FaHome />, path: '/feed' },
    { name: 'For You', icon: <FaFire />, path: '/reels' }, // App.js এর সাথে সামঞ্জস্য রেখে /reels করা হয়েছে
    { name: 'Following', icon: <FaUserPlus />, path: '/following' }, 
    { name: 'Analytics', icon: <HiOutlineChartBar />, path: '/analytics' },
    { name: 'Messages', icon: <FaEnvelope />, path: '/messages' }, // path: '/messenger' থেকে '/messages' এ পরিবর্তন
    { name: 'Explore', icon: <FaCompass />, path: '/explorer' },
    { name: 'Settings', icon: <FaCog />, path: '/settings' },
  ];

  return (
    <div className="flex flex-col h-full py-6 justify-between bg-transparent">
      
      {/* ১. মেইন নেভিগেশন */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-4 mb-6 italic">Neural Menu</p>
        
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
              ${isActive
                ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-4 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                : 'text-gray-500 hover:text-white hover:bg-white/5'}
            `}
          >
            <span className="text-xl group-hover:scale-110 transition-transform">
              {item.icon}
            </span>
            <span className="text-sm font-bold tracking-wide uppercase italic">{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* ২. প্রো কার্ড এবং লগআউট */}
      <div className="px-2 mt-auto space-y-4">
        
        <div className="bg-gradient-to-br from-purple-600/20 to-cyan-500/10 rounded-[2.5rem] p-6 border border-white/5 relative overflow-hidden group shadow-2xl">
          <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:rotate-12 transition-all duration-500 group-hover:scale-110">
             <FaRocket size={60} className="text-cyan-400" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 italic">Onyx Pro</p>
            <p className="text-[11px] font-bold text-white/90 mb-4 leading-snug">Level up your neural experience today.</p>
            
            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-tighter transition-all active:scale-95 border border-white/10">
              Upgrade System
            </button>
          </div>
        </div>

        <button 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="w-full flex items-center gap-4 px-6 py-4 text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl transition-all duration-300 font-bold text-xs uppercase italic"
        >
          <FaSignOutAlt size={18} />
          <span>Disconnect</span>
        </button>

      </div>
    </div>
  );
};

export default Sidebar;