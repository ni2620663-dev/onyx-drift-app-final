import React, { useState, useEffect } from "react"; // useEffect যোগ করা হয়েছে
import Navbar from "./components/Navbar/Navbar.jsx";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft.jsx";
import SidebarRight from "./components/SidebarRight/SidebarRight.jsx";
import StoriesCarousel from "./components/StoriesCarousel/StoriesCarousel.jsx";
import CreatePost from "./components/CreatePost/CreatePost.jsx";
import PostFeed from "./components/PostFeed/PostFeed.jsx";

// ⚠️ গুরুত্বপূর্ণ: এই URL টি আপনার Render Web Service-এর আসল URL দিয়ে পরিবর্তন করুন
// যদি আপনার API এ পোস্ট ডেটা /posts রুটে থাকে, তাহলে URL টি সেই অনুযায়ী পরিবর্তন করুন।
const RENDER_API_URL = "https://onyx-drift-app-final.onrender.com"; 

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // পোস্ট ডেটা ধরে রাখার জন্য নতুন state তৈরি
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 API থেকে ডেটা ফেচ করার লজিক
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${RENDER_API_URL}/posts`); // 👈 API কল
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data); // প্রাপ্ত ডেটা state-এ সেভ করা
      } catch (e) {
        console.error("Failed to fetch posts:", e);
        setError("Failed to load posts from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []); // কম্পোনেন্টটি প্রথমবার লোড হওয়ার সময় একবার চলবে

  // রেন্ডার লজিক
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-500">
        <Navbar toggleDarkMode={toggleDarkMode} />
        <div className="flex max-w-7xl mx-auto gap-4 p-4">
          {/* Left Sidebar */}
          <SidebarLeft />

          {/* Center Feed */}
          <div className="flex-1 space-y-6">
            <StoriesCarousel />
            <CreatePost />

            {/* PostFeed কম্পোনেন্টে ডেটা পাস করা */}
            <PostFeed 
              posts={posts} 
              loading={loading} 
              error={error} 
            />
          </div>

          {/* Right Sidebar */}
          <SidebarRight />
        </div>
      </div>
    </div>
  );
}