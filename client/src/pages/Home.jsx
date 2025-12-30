import React, { useState, useEffect, useContext } from "react";
import PostBox from "../components/PostBox";
import PostFeed from "../components/PostFeed";
import StorySection from "../components/StorySection";
import RightSidebar from "../components/RightSidebar"; // Right Sidebar ইম্পোর্ট করা হয়েছে
import { AuthContext } from "../context/AuthContext";
import { fetchPersonalizedPosts } from "../api";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const auth = useContext(AuthContext);
  const token = auth?.token;

  // পোস্ট লোড করার ফাংশন
  const loadPosts = () => {
    if (!token) return;
    fetchPersonalizedPosts(token)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Error loading posts:", err));
  };

  useEffect(() => {
    if (token) {
      loadPosts();
    }
  }, [token]);

  return (
    <div className="flex justify-center lg:justify-between py-6 px-4 min-h-screen bg-[#18191a]">
      
      {/* ১. মাঝখানের ফিড সেকশন (Main Feed) */}
      <div className="w-full max-w-[580px] flex flex-col space-y-6 mx-auto lg:mx-0 lg:ml-auto lg:mr-8">
        
        {/* সবার উপরে পোস্ট বক্স (এখন এতে ক্লিক করলে পপ-আপ ওপেন হবে) */}
        <PostBox onPostCreated={loadPosts} />
        
        {/* তার নিচে স্টোরি সেকশন */}
        <StorySection />

        {/* সবশেষে পোস্টের ফিড */}
        <PostFeed posts={posts} onAction={loadPosts} />
        
      </div>

      {/* ২. ডানপাশের কন্টাক্ট লিস্ট (Contacts Sidebar) */}
      {/* এটি শুধুমাত্র বড় স্ক্রিনে (Desktop) দেখা যাবে */}
      <div className="hidden xl:block">
        <RightSidebar />
      </div>

    </div>
  );
};

export default Home;