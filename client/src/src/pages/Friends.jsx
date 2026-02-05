import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { 
  FaUserPlus, FaCheck, FaSearch, FaArrowLeft, 
  FaEllipsisH, FaTimes, FaUserCheck 
} from "react-icons/fa";

const Friends = () => {
  const { user, isAuthenticated } = useAuth0();
  const [activeTab, setActiveTab] = useState("suggested");
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);

  // আপনার রেন্ডার সার্ভার লিঙ্ক
  const BASE_URL = "https://onyx-drift-app-final.onrender.com";

  // ১. ইউজার লিস্ট ফেচ করা (সাজেশন হিসেবে)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // আপনার ব্যাকএন্ডে যদি সব ইউজার লিস্টের রুট থাকে
        const res = await axios.get(`${BASE_URL}/api/users`);
        setUsersList(res.data);
      } catch (err) {
        console.error("Users fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ২. ফলো/ফ্রেন্ড রিকোয়েস্ট হ্যান্ডলার (Twitter Style)
  const handleConnect = async (targetUserId) => {
    if (!isAuthenticated) return alert("Please login first");
    
    try {
      // লোকালহোস্ট বদলে প্রোডাকশন লিঙ্ক ব্যবহার করা হয়েছে
      await axios.post(`${BASE_URL}/api/friend-request`, {
        senderId: user.sub,
        receiverId: targetUserId
      });

      alert("Connection Request Sent!");
      
      // লোকাল স্টেট আপডেট (বাটন চেঞ্জ করার জন্য)
      setUsersList(prev => prev.map(u => 
        u._id === targetUserId ? { ...u, requested: true } : u
      ));
    } catch (err) {
      console.error(err);
      alert("Error connecting. Try again.");
    }
  };

  return (
    <div className="flex bg-black min-h-screen text-white">
      
      {/* মেইন কানেক্ট এরিয়া (Twitter Style Feed) */}
      <div className="flex-1 max-w-[600px] mx-auto border-x border-white/10">
        
        {/* হেডার */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 px-4 py-3 flex items-center gap-8 border-b border-white/10">
          <FaArrowLeft className="cursor-pointer hover:bg-white/10 p-2 rounded-full text-3xl" />
          <div>
            <h1 className="text-xl font-bold">Connect</h1>
            <p className="text-xs text-gray-500">Suggested for you</p>
          </div>
        </div>

        {/* ট্যাব সিস্টেম */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab("suggested")}
            className={`flex-1 py-4 text-sm font-bold hover:bg-white/5 transition relative ${activeTab === 'suggested' ? "text-white" : "text-gray-500"}`}
          >
            Suggested
            {activeTab === 'suggested' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-cyan-500 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-4 text-sm font-bold hover:bg-white/5 transition relative ${activeTab === 'followers' ? "text-white" : "text-gray-500"}`}
          >
            Followers
            {activeTab === 'followers' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-cyan-500 rounded-full" />}
          </button>
        </div>

        {/* ইউজার লিস্ট */}
        <div className="divide-y divide-white/10">
          {loading ? (
            <div className="p-10 text-center text-cyan-500 animate-pulse font-bold">Searching Neural Network...</div>
          ) : (
            usersList.map((person) => (
              <div key={person._id || person.id} className="p-4 flex items-start gap-3 hover:bg-white/[0.02] transition cursor-pointer">
                <img 
                  src={person.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} 
                  className="w-12 h-12 rounded-full object-cover" 
                  alt="" 
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-[15px] hover:underline">{person.name}</h3>
                      <p className="text-gray-500 text-sm">@{person.name?.toLowerCase().replace(/\s/g, '')}</p>
                    </div>
                    <button 
                      onClick={() => handleConnect(person._id)}
                      disabled={person.requested}
                      className={`px-5 py-1.5 rounded-full font-bold text-sm transition ${
                        person.requested 
                        ? "border border-white/20 text-white" 
                        : "bg-white text-black hover:bg-gray-200"
                      }`}
                    >
                      {person.requested ? "Pending" : "Follow"}
                    </button>
                  </div>
                  <p className="text-[14px] mt-1 text-gray-200">{person.bio || "Hello! I am using Onyx Drift."}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ডান পাশের সার্চ বার (Twitter Right Sidebar Style) */}
      <div className="hidden lg:block w-[350px] p-4 sticky top-0 h-screen">
        <div className="relative group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-500" />
          <input 
            type="text" 
            placeholder="Search Signals" 
            className="w-full bg-[#202327] rounded-full py-3 pl-12 pr-4 text-sm outline-none border border-transparent focus:border-cyan-500 focus:bg-black transition"
          />
        </div>
        
        <div className="bg-[#16181c] rounded-2xl mt-4 p-4">
          <h2 className="text-xl font-bold mb-4">Who to follow</h2>
          {/* ছোট সাজেশন লিস্ট এখানে দিতে পারেন */}
          <p className="text-xs text-gray-500 mt-4">Terms of Service Privacy Policy Cookie Policy</p>
          <p className="text-xs text-gray-500">© 2026 ONYX DRIFT Corp.</p>
        </div>
      </div>

    </div>
  );
};

export default Friends;