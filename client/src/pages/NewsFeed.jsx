import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Share2, Repeat } from 'lucide-react';

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        // ১০০ মিলিয়ন ইউজারের জন্য ক্যাশ-ফার্স্ট রিকোয়েস্ট
        const res = await axios.get('https://onyx-drift-app-final.onrender.com/api/feed/current-user');
        setPosts(res.data);
      } catch (err) {
        console.error("Feed Transmission Interrupted");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  if (loading) return <div className="text-cyan-500 font-black text-center p-10 animate-pulse">📡 SYNCHRONIZING NEURAL LINK...</div>;

  return (
    <div className="flex flex-col gap-6 mt-8">
      {posts.map((post) => (
        <div key={post._id} className="bg-[#151515] rounded-[2rem] border border-white/5 overflow-hidden transition-all hover:border-cyan-500/30">
          {/* Post Header */}
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-black">
                {post.userName?.substring(0, 2).toUpperCase() || 'OD'}
              </div>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold tracking-tight">{post.userName || 'Drifter'}</h4>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Neural ID: {post._id.substring(0, 8)}</p>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-5 pb-4 text-gray-300 text-sm leading-relaxed">
            {post.content}
          </div>

          {/* Post Image (Directly from Cloudinary) */}
          {post.image && (
            <div className="px-2">
              <img 
                src={post.image} 
                className="w-full h-[400px] object-cover rounded-[1.5rem] border border-white/5" 
                alt="Post Media"
              />
            </div>
          )}

          {/* Interaction Bar */}
          <div className="p-4 flex items-center justify-around border-t border-white/5 mt-2">
            <button className="flex items-center gap-2 text-gray-500 hover:text-rose-500 transition-colors">
              <Heart size={18} /> <span className="text-[10px] font-black">2.4K</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors">
              <MessageCircle size={18} /> <span className="text-[10px] font-black">128</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-purple-500 transition-colors">
              <Repeat size={18} /> <span className="text-[10px] font-black">DRIFT</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;