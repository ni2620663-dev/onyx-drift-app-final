import React from "react";
import { FaPlusCircle } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";

const StorySection = ({ serverStories = [] }) => {
  const { user } = useAuth0();

  // ডাটাবেজে স্টোরি না থাকলে দেখানোর জন্য ডামি ডাটা (আপনি চাইলে এটি সরিয়ে দিতে পারেন)
  const dummyStories = [
    { id: 1, name: "Raju Ahmed", img: "https://picsum.photos/id/101/200/300", avatar: "https://i.pravatar.cc/150?u=raju" },
    { id: 2, name: "Tanha Islam", img: "https://picsum.photos/id/102/200/300", avatar: "https://i.pravatar.cc/150?u=tanha" }
  ];

  // যদি serverStories খালি থাকে, তবে dummyStories দেখাবে (টেস্ট করার জন্য)
  const storiesToShow = serverStories.length > 0 ? serverStories : dummyStories;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 px-2 w-full bg-transparent">
      
      {/* ১. নিজের স্টোরি তৈরির বাটন */}
      <div 
        onClick={() => alert("Story Clicked!")}
        className="min-w-[110px] h-[190px] bg-white rounded-xl overflow-hidden shadow-md relative flex flex-col group cursor-pointer flex-shrink-0 border border-gray-200 z-10"
      >
        <div className="h-[145px] overflow-hidden">
          <img 
            src={user?.picture || "https://via.placeholder.com/200/300"} 
            className="w-full h-full object-cover transition duration-300 group-hover:scale-110" 
            alt="me" 
          />
        </div>
        
        {/* প্লাস আইকন - z-20 দেওয়া হয়েছে যাতে ক্লিক হয় */}
        <div className="absolute top-[130px] left-1/2 -translate-x-1/2 bg-blue-600 p-1 rounded-full border-4 border-white z-20 shadow-lg">
          <FaPlusCircle className="text-white text-xl" />
        </div>

        <div className="flex-1 flex items-end justify-center pb-2 bg-white">
          <span className="text-[12px] font-semibold text-gray-700">Create story</span>
        </div>
      </div>

      {/* ২. অন্যদের স্টোরি লুপ */}
      {storiesToShow.map((s) => (
        <div 
          key={s.id} 
          className="min-w-[110px] h-[190px] rounded-xl overflow-hidden shadow-md relative group cursor-pointer flex-shrink-0 border border-gray-200"
        >
          <img 
            src={s.img} 
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
            alt="story" 
          />
          
          {/* প্রোফাইল পিকচার ওভারলে */}
          <div className="absolute top-3 left-3 z-10">
             <div className="p-[2px] bg-blue-600 rounded-full border-2 border-white">
                <img 
                  src={s.avatar} 
                  className="w-8 h-8 rounded-full object-cover" 
                  alt="avatar" 
                />
             </div>
          </div>

          {/* গ্রেডিয়েন্ট এবং নাম */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <span className="text-white text-[12px] font-medium drop-shadow-md leading-tight">
              {s.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StorySection;