import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { FaHeart, FaRegHeart, FaComment, FaPaperPlane } from "react-icons/fa";
import moment from "moment";

const Feed = ({ refreshTrigger }) => {
  const { user } = useAuth0();
  const [posts, setPosts] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;
  const [commentText, setCommentText] = useState({});

  // পোস্ট নিয়ে আসার ফাংশন
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Fetch posts failed", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);

  // লাইক ফাংশন (ডুপ্লিকেট রিমুভ করা হয়েছে)
  const handleLike = async (postId) => {
    try {
      await axios.put(`${API_URL}/api/posts/${postId}/like`);
      fetchPosts(); // ডাটা রিফ্রেশ
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  // কমেন্ট ফাংশন (লজিক ফিক্স করা হয়েছে)
  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return; // ফাঁকা কমেন্ট আটকানোর জন্য

    try {
      await axios.post(`${API_URL}/api/posts/${postId}/comment`, {
        userName: user.name,
        userAvatar: user.picture,
        text: text,
      });
      // ইনপুট ফিল্ড খালি করা
      setCommentText({ ...commentText, [postId]: "" });
      fetchPosts(); // ডাটা রিফ্রেশ
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {posts.map((post) => (
        <div key={post._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700">
          {/* Header */}
          <div className="p-4 flex items-center gap-3">
            <img src={post.userAvatar} className="w-10 h-10 rounded-full" alt="" />
            <div>
              <h4 className="font-bold dark:text-white">{post.userName}</h4>
              <p className="text-xs text-gray-500">{moment(post.createdAt).fromNow()}</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-2 dark:text-gray-200">{post.content}</div>

          {/* Actions */}
          <div className="p-4 flex gap-6 border-t dark:border-gray-700 mt-2">
            <button onClick={() => handleLike(post._id)} className="flex items-center gap-2 hover:scale-110 transition">
              {post.likes.includes(user?.sub) ? 
                <FaHeart className="text-red-500 shadow-sm" /> : 
                <FaRegHeart className="dark:text-gray-400" />
              }
              <span className="text-sm dark:text-gray-400 font-bold">{post.likes.length}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-500">
              <FaComment /> <span className="text-sm font-bold">{post.comments.length}</span>
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
            {post.comments.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <img src={c.userAvatar} className="w-7 h-7 rounded-full" alt="" />
                <div className="bg-gray-200 dark:bg-gray-700 p-2 px-3 rounded-2xl text-sm">
                  <span className="font-bold block dark:text-white">{c.userName}</span>
                  <span className="dark:text-gray-300">{c.text}</span>
                </div>
              </div>
            ))}

            {/* Comment Input */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText[post._id] || ""}
                onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)} // এন্টার চাপলে কমেন্ট হবে
                className="flex-1 bg-white dark:bg-gray-800 border dark:border-gray-700 p-2 px-4 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
              />
              <button onClick={() => handleComment(post._id)} className="text-blue-500 p-2">
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Feed;