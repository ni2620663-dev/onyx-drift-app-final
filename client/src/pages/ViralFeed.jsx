import { useEffect, useState } from "react";
import axios from "axios";
import PostCard from "./PostCard"; // আপনার আগের বানানো পোস্ট কার্ড কম্পোনেন্ট
import { Loader } from "lucide-react"; // বা আপনার পছন্দের লোডার

const ViralFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViralPosts = async () => {
      try {
        // আপনার API URL এখানে বসান
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts/viral-feed`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setPosts(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Viral Feed Error:", err);
        setLoading(false);
      }
    };

    fetchViralPosts();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>;

  return (
    <div className="viral-feed-container bg-black min-h-screen">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto p-4">
        <h2 className="text-xl font-bold text-cyan-400 border-b border-cyan-900 pb-2">
          🔥 TRENDING DRIFTS
        </h2>
        
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        ) : (
          <p className="text-gray-500 text-center mt-10">No trending drifts found in the neural network.</p>
        )}
      </div>
    </div>
  );
};

export default ViralFeed;