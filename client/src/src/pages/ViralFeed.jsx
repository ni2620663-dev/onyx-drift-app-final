import { useEffect, useState } from "react";
import axios from "axios";
import { Loader, Flame, Radio } from "lucide-react"; 
import PostCard from "../components/PostCard"; 

const ViralFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ডাইনামিক এপিআই ইউআরএল
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  useEffect(() => {
    const fetchViralPosts = async () => {
      try {
        // ব্যাকএন্ডের রুট অনুযায়ী চেক করুন: /viral-feed নাকি /neural-feed
        // আপনার দেওয়া ব্যাকএন্ড কোডে এটি ছিল /viral-feed
        const res = await axios.get(`${API_URL}/api/posts/viral-feed`);
        setPosts(res.data);
      } catch (err) {
        console.error("Viral Feed Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchViralPosts();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#010409] gap-4">
        <div className="relative">
          <Loader className="animate-spin text-cyan-500" size={40} />
          <div className="absolute inset-0 animate-ping border-2 border-cyan-500 rounded-full opacity-20"></div>
        </div>
        <p className="text-[10px] text-cyan-500/50 uppercase tracking-[0.5em] animate-pulse">Syncing_Viral_Grid</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010409] text-white font-mono selection:bg-cyan-500/30">
      <div className="max-w-2xl mx-auto px-4 py-10">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Flame className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
                Neural_Feed
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Live Viral Signals
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Radio size={12} className="text-red-500 animate-pulse" />
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Sector_01 Active</span>
          </div>
        </div>
        
        {/* Posts List */}
        <div className="flex flex-col gap-8">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post._id} className="transition-all duration-500 hover:translate-x-1">
                 <PostCard post={post} />
              </div>
            ))
          ) : (
            <div className="text-center py-32 border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
              <div className="mb-4 flex justify-center opacity-20">
                <Radio size={48} />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
                Scanning for signals... <br/> No neural activity detected.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar for modern look */}
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #010409; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #0891b2, #0e7490); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ViralFeed;