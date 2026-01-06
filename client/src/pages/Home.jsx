import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { BRAND_NAME } from "../utils/constants";

// Components
import StorySection from "../components/StorySection";
import PostBox from "../components/PostBox";
import PostCard from "../components/PostCard";
import { FaSpinner, FaBolt } from "react-icons/fa"; // FaBolt যোগ করা হয়েছে

const Home = ({ user, searchQuery = "" }) => { 
  const { getAccessTokenSilently } = useAuth0();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false); // Redis/Cache ইন্ডিকেটর

  // ১. এন্টারপ্রাইজ এপিআই কনফিগারেশন (সরাসরি ভেরিয়েবল ব্যবহার না করে কনফিগার করা)
  const API_BASE_URL = "https://onyx-drift-api-server.onrender.com/api";

  // ২. মেমোইজড ফেচ ফাংশন (পারফরম্যান্স অপ্টিমাইজেশনের জন্য)
  const fetchPosts = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const startTime = Date.now();

      const response = await axios.get(`${API_BASE_URL}/posts`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache" 
        },
        params: { t: Date.now() } // ক্যাশ-বাস্টিং
      });

      // ৩. লেটেন্সি চেক (সিস্টেম স্পিড বোঝানোর জন্য)
      const latency = Date.now() - startTime;
      if (latency < 100) setIsCached(true); // যদি খুব দ্রুত আসে তবে এটি ক্যাশড

      setPosts(response.data);
    } catch (err) {
      console.error("Neural Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ৪. ফিল্টারিং লজিক
  const filteredPosts = posts.filter((post) => {
    const term = searchQuery.toLowerCase();
    return (
      post.authorName?.toLowerCase().includes(term) || 
      post.text?.toLowerCase().includes(term)
    );
  });

  const glassStyle = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem]";

  return (
    <div className="w-full min-h-screen bg-transparent">
      <main className="w-full max-w-[680px] mx-auto py-4 flex flex-col gap-6 px-4 sm:px-0">
        
        {/* ৫. সিস্টেম স্ট্যাটাস বার (Enterprise Look) */}
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
             <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isCached ? 'bg-cyan-400' : 'bg-green-400'}`}></div>
             <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
               {isCached ? 'Neural Cache Active' : 'Direct Sync Active'}
             </span>
          </div>
          {isCached && <FaBolt className="text-cyan-400 text-[10px] animate-bounce" />}
        </div>

        {/* Global Memories (Stories) */}
        <div className={`${glassStyle} p-6 hover:bg-white/[0.07] transition-all`}>
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[.5em] mb-5 px-2">Global Memories</p>
            <StorySection user={user} />
        </div>

        {/* Post Creation Box */}
        <div className="w-full">
            <PostBox user={user} onPostCreated={fetchPosts} />
        </div>

        {/* OnyxDrift Stream Divider */}
        <div className="flex items-center gap-4 px-4 py-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{BRAND_NAME} Stream</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* Posts Feed Area */}
        <div className="flex flex-col gap-6 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <FaSpinner className="text-cyan-400 animate-spin text-3xl" />
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Syncing with {BRAND_NAME} Core...
              </p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <PostCard 
                    post={post} 
                    onAction={fetchPosts} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className={`${glassStyle} p-12 text-center`}>
              <p className="text-gray-500 text-sm font-light italic">
                {searchQuery ? `No data found for "${searchQuery}"` : "The universe is quiet... Start the conversation."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;