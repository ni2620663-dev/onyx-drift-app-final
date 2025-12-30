import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FaEdit, FaCamera, FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaLink } from "react-icons/fa";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600 animate-pulse text-2xl">OnyxDrift...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* ১. কভার এবং প্রোফাইল সেকশন */}
      <div className="relative max-w-[1000px] mx-auto bg-white rounded-b-3xl shadow-sm overflow-hidden border-x border-b border-gray-100">
        
        {/* কভার ফটো (ইউনিক গ্রেডিয়েন্ট লুক) */}
        <div className="h-48 md:h-80 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 relative group">
          <button className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/30 transition shadow-lg">
            <FaCamera /> <span className="text-sm font-bold">Edit Cover Photo</span>
          </button>
        </div>

        {/* প্রোফাইল ইমেজ ও নাম */}
        <div className="px-6 pb-6 flex flex-col items-center md:items-start md:flex-row md:gap-6 -mt-12 md:-mt-16">
          <div className="relative group">
            <img 
              src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"} 
              className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white shadow-xl object-cover bg-white" 
              alt="Profile"
            />
            <button className="absolute bottom-2 right-2 p-2 bg-gray-100 rounded-full border-2 border-white hover:bg-gray-200 transition">
              <FaCamera className="text-gray-700" size={14} />
            </button>
          </div>

          <div className="mt-4 md:mt-20 text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user?.name}</h1>
            <p className="text-gray-500 font-medium">500 friends • {user?.nickname || "Dreamer"}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2">
                <FaPlus size={14}/> Add to Story
              </button>
              <button className="bg-gray-100 text-gray-800 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition flex items-center gap-2">
                <FaEdit size={14}/> Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ২. ইনফরমেশন গ্রিড (Main Content) */}
      <div className="max-w-[1000px] mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        
        {/* বাম পাশ: ইন্ট্রো এবং ডিটেইলস */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-4">Intro</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <FaBriefcase className="text-gray-400" /> 
                <span>Works at <span className="font-bold">OnyxDrift Tech</span></span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <FaGraduationCap className="text-gray-400" size={20} /> 
                <span>Studied at <span className="font-bold">Software Engineering</span></span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <FaMapMarkerAlt className="text-gray-400" /> 
                <span>From <span className="font-bold">Dhaka, Bangladesh</span></span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <FaLink className="text-gray-400" /> 
                <a href="#" className="text-blue-600 font-medium hover:underline">onyxdrift.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* ডান পাশ: পোস্ট এবং ফিড */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500 font-medium italic">
            "Every developer is an artist, and the code is their canvas."
          </div>
          {/* এখানে আপনি আপনার PostBox এবং PostFeed কম্পোনেন্টটি রাখতে পারেন */}
          <div className="opacity-50 text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
            Your posts will appear here...
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;