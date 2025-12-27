import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../components/Sidebar";
import PostFeed from "../components/PostFeed";
import MediaUploader from "../components/MediaUploader";
import { fetchPersonalizedPosts } from "../api";
import { AuthContext } from "../context/AuthContext";
import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { FaImage, FaSmile, FaPaperPlane } from "react-icons/fa";

const PostBox = ({ onPostCreated }) => {
  const { user } = useAuth0();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setLoading(true);
    try {
      // এখানে আপনার ব্যাকএন্ডের পোস্ট ক্রিয়েশন এপিআই কল হবে
      const postData = {
        userId: user.sub,
        userName: user.name,
        userAvatar: user.picture,
        content: content,
        image: image, // ইমেজ হ্যান্ডলিংয়ের জন্য পরবর্তীতে Cloudinary ব্যবহার করা ভালো
      };

      const res = await axios.post(`${API_URL}/api/posts`, postData);
      
      setContent("");
      setImage(null);
      if (onPostCreated) onPostCreated(res.data);
      alert("✅ Post shared successfully!");
    } catch (err) {
      console.error("❌ Post error:", err);
      alert("❌ Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 transition-all">
      <div className="flex gap-4">
        {/* ইউজার অ্যাভাটার */}
        <img
          src={user?.picture}
          alt="User"
          className="w-12 h-12 rounded-full object-cover shadow-sm"
        />
        export default PostBox;
const Home = () => {
  const [posts, setPosts] = useState([]);
  const { token } = useContext(AuthContext);

  const loadPosts = () => {
    if (!token) return;
    fetchPersonalizedPosts(token)
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadPosts();
  }, [token]);
        {/* ইনপুট ফিল্ড */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user?.nickname || 'friend'}?`}
            className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-2xl p-4 text-gray-700 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 resize-none transition-all"
            rows="2"
          />
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-600">
            {/* একশন বাটনসমূহ */}
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition text-gray-600 dark:text-gray-300 font-medium">
                <FaImage className="text-green-500 text-xl" />
                <span className="hidden sm:inline">Photo</span>
                <input type="file" className="hidden" accept="image/*" />
              </label>
              
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-gray-600 dark:text-gray-300 font-medium">
                <FaSmile className="text-yellow-500 text-xl" />
                <span className="hidden sm:inline">Feeling</span>
              </button>
            </div>
export default PostBox;
const Home = () => {
  const [posts, setPosts] = useState([]);
  const { token } = useContext(AuthContext);

  const loadPosts = () => {
    if (!token) return;
    fetchPersonalizedPosts(token)
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadPosts();
  }, [token]);
            {/* সাবমিট বাটন */}
            <button
              onClick={handlePostSubmit}
              disabled={loading || !content.trim()}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-white transition transform active:scale-95 ${
                loading || !content.trim() ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none"
              }`}
            >
              {loading ? "Posting..." : <><FaPaperPlane /> Post</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostBox;
const Home = () => {
  const [posts, setPosts] = useState([]);
  const { token } = useContext(AuthContext);

  const loadPosts = () => {
    if (!token) return;
    fetchPersonalizedPosts(token)
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadPosts();
  }, [token]);

  return (
    <div className="flex pt-16">
      <Sidebar />
      <div className="flex-1 p-4 w-full">
        <MediaUploader onPostCreated={() => loadPosts()} />
        <PostFeed posts={posts} />
      </div>
    </div>
  );
};

export default Home;
