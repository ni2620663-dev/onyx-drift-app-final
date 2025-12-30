import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FaEdit, FaCamera, FaMapMarkerAlt, FaBriefcase, FaPlus, FaCheckCircle } from "react-icons/fa";
import { MdDashboard, MdGridOn, MdViewList, MdVerified } from "react-icons/md";
import axios from "axios";
import PostCard from "../components/PostCard";

const Profile = () => {
  const { user, isLoading, getAccessTokenSilently } = useAuth0();
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // ইমেজ ও পোস্ট স্টেট
  const [profileImg, setProfileImg] = useState(user?.picture);
  const [coverImg, setCoverImg] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postText, setPostText] = useState("");

  // ভিডিও ও প্রোফাইল ডাটা স্টেট
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [stats, setStats] = useState({ followers: 556, following: 1 });
  const [editData, setEditData] = useState({
    name: "",
    bio: "Digital creator | Tech Enthusiast",
    workplace: "OnyxDrift",
    location: "Dhaka, Bangladesh",
    isVerified: true,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  // ডাটা ফেচ করা
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const token = await getAccessTokenSilently();
        setEditData(prev => ({ ...prev, name: user.name || "Onyx User" }));
        setProfileImg(user.picture);

        const postRes = await axios.get(`${API_URL}/api/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const myPosts = postRes.data.filter(post => 
          post.userId === user?.sub || post.author?._id === user?.sub
        );
        setUserPosts(myPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [user, getAccessTokenSilently, API_URL]);

  // ইমেজ পরিবর্তন হ্যান্ডলার
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "profile") setProfileImg(reader.result);
        if (type === "cover") setCoverImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // প্রোফাইল আপডেট সেভ
  const handleSave = async () => {
    try {
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/users/profile/update`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Profile updated!");
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Updated locally. Connect backend for permanent save.");
      setIsEditModalOpen(false);
    }
  };

  // নতুন পোস্ট হ্যান্ডলার
  const handleCreatePost = async () => {
    if(!postText) return;
    setIsPosting(true);
    // এখানে আপনার পোস্ট করার API কল হবে
    setTimeout(() => {
      alert("Post shared successfully!");
      setPostText("");
      setIsPosting(false);
    }, 1500);
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f0f0f] text-[#0866ff]">
      <div className="w-12 h-12 border-4 border-t-transparent border-[#0866ff] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111111] text-[#e4e6eb] font-sans pb-10">
      
      {/* --- প্রোফাইল হেডার (Cover & Profile) --- */}
      <div className="bg-[#1c1c1c] border-b border-white/5 shadow-2xl">
        <div className="max-w-[1100px] mx-auto">
          {/* Cover Photo */}
          <div className="relative h-[250px] md:h-[420px] bg-[#2a2a2a] rounded-b-[2rem] overflow-hidden">
            {coverImg && <img src={coverImg} className="w-full h-full object-cover" alt="Cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <label className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-xl text-white px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 font-bold cursor-pointer hover:bg-black/70 z-20 transition">
              <FaCamera /> Edit Cover
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, "cover")} />
            </label>
          </div>

          <div className="px-6 md:px-12 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 relative z-30">
              {/* Profile Image */}
              <div className="relative group">
                <div className="w-[180px] h-[180px] rounded-full p-1 bg-gradient-to-tr from-[#0866ff] to-[#00ffcc]">
                  <img src={profileImg || "https://api.dicebear.com/7.x/initials/svg?seed=User"} className="w-full h-full rounded-full object-cover border-[5px] border-[#1c1c1c]" alt="Profile"/>
                </div>
                <label className="absolute bottom-3 right-3 p-3 bg-[#3a3b3c] rounded-full border border-gray-600 cursor-pointer hover:scale-110 transition shadow-xl text-white">
                  <FaCamera size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, "profile")} />
                </label>
              </div>

              <div className="flex-1 text-center md:text-left mb-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">{editData.name}</h1>
                  {editData.isVerified && <MdVerified className="text-[#0866ff]" size={28} />}
                </div>
                <p className="text-gray-400 font-bold mt-1">{stats.followers} Followers • {stats.following} Following</p>
              </div>

              <div className="flex gap-3 mb-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none bg-[#0866ff] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"><MdDashboard size={20}/> Dashboard</button>
                <button onClick={() => setIsEditModalOpen(true)} className="flex-1 md:flex-none bg-white/10 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10"><FaEdit size={16}/> Edit Profile</button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mt-8 border-t border-white/5 pt-2">
                {["Posts", "About", "Reels", "Photos"].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab ? "bg-[#0866ff]/10 text-[#0866ff]" : "text-gray-400 hover:bg-white/5"}`}>
                    {tab}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Section --- */}
      <div className="max-w-[1100px] mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
        
        {/* Left Side: Intro */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1c1c1c] p-6 rounded-[1.5rem] border border-white/5 shadow-xl sticky top-24">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0866ff] rounded-full"></span> Intro
            </h2>
            <div className="space-y-5">
              <p className="text-center italic text-gray-400">"{editData.bio}"</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4"><FaBriefcase className="text-[#0866ff] text-xl" /> <span className="text-sm font-medium">Digital Creator at <span className="font-bold">{editData.workplace}</span></span></div>
                <div className="flex items-center gap-4"><FaMapMarkerAlt className="text-pink-500 text-xl" /> <span className="text-sm font-medium">From <span className="font-bold">{editData.location}</span></span></div>
                {editData.isVerified && <div className="flex items-center gap-4"><FaCheckCircle className="text-green-500 text-xl" /> <span className="text-sm font-medium">Verified Profile</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Feed & Tabs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Create Post Box (Only in Posts Tab) */}
          {activeTab === "Posts" && (
            <div className="bg-[#1c1c1c] p-6 rounded-[1.5rem] border border-white/5 shadow-xl">
              <div className="flex gap-4">
                <img src={profileImg} className="w-12 h-12 rounded-full object-cover border-2 border-[#0866ff]" alt="User" />
                <textarea 
                  placeholder={`What's on your mind, ${editData.name.split(' ')[0]}?`}
                  className="w-full bg-[#111] border-none rounded-2xl p-4 text-white resize-none outline-none focus:ring-1 ring-[#0866ff] min-h-[100px]"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                <button className="flex items-center gap-2 text-gray-400 hover:text-green-500 font-bold transition">
                   <FaCamera /> Photo/Video
                </button>
                <button 
                  onClick={handleCreatePost}
                  disabled={!postText || isPosting}
                  className="bg-[#0866ff] text-white px-8 py-2 rounded-xl font-bold hover:brightness-110 disabled:opacity-50 transition shadow-lg"
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Content Based on Tab */}
          <div className="space-y-6">
            {activeTab === "Posts" && (
              userPosts.length > 0 ? userPosts.map(post => <PostCard key={post._id} post={post} />) : 
              <div className="bg-[#1c1c1c] p-10 rounded-[1.5rem] text-center text-gray-500 italic">No posts in your timeline yet.</div>
            )}

            {activeTab === "About" && (
              <div className="bg-[#1c1c1c] p-8 rounded-[1.5rem] border border-white/5 shadow-xl animate-in fade-in">
                <h4 className="text-xl font-bold mb-4">About Me</h4>
                <div className="space-y-4 text-gray-400">
                   <p>👋 Hi, I am <span className="text-white font-bold">{editData.name}</span>.</p>
                   <p>💼 Working at: <span className="text-white font-bold">{editData.workplace}</span>.</p>
                   <p>📍 Based in: <span className="text-white font-bold">{editData.location}</span>.</p>
                </div>
              </div>
            )}

            {activeTab === "Reels" && (
              <div className="bg-[#1c1c1c] p-10 rounded-[1.5rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-[#0866ff]/10 rounded-full flex items-center justify-center text-[#0866ff]"><FaPlus size={24}/></div>
                 <p className="font-bold">Share your first reel</p>
                 <input type="file" accept="video/*" id="reel-up" className="hidden" />
                 <label htmlFor="reel-up" className="bg-[#0866ff] text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:brightness-110">Upload Video</label>
              </div>
            )}

            {activeTab === "Photos" && (
              <div className="grid grid-cols-3 gap-3">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                   <div key={i} className="aspect-square bg-[#2a2a2a] rounded-xl overflow-hidden hover:scale-105 transition cursor-pointer">
                     <img src={`https://picsum.photos/seed/${i+40}/400`} className="w-full h-full object-cover" alt="Gallery"/>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Edit Profile Modal --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#1c1c1c] w-full max-w-[500px] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-black text-[#0866ff]">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:text-red-500">✕</button>
            </div>
            <div className="p-8 space-y-4">
              <input className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#0866ff]" placeholder="Name" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
              <textarea className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white h-20 outline-none focus:border-[#0866ff]" placeholder="Bio" value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} />
              <input className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#0866ff]" placeholder="Workplace" value={editData.workplace} onChange={(e) => setEditData({...editData, workplace: e.target.value})} />
              <input className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#0866ff]" placeholder="Location" value={editData.location} onChange={(e) => setEditData({...editData, location: e.target.value})} />
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm font-bold">Verified Official Badge</span>
                <input type="checkbox" className="w-5 h-5 accent-[#0866ff]" checked={editData.isVerified} onChange={(e) => setEditData({...editData, isVerified: e.target.checked})} />
              </div>
            </div>
            <div className="p-6 bg-[#111]/50 border-t border-white/5">
              <button onClick={handleSave} className="w-full bg-[#0866ff] text-white font-black py-4 rounded-2xl hover:brightness-110 shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;