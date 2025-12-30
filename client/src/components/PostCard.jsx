import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, FaShare } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const PostCard = ({ post, onAction }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000";

  // ১. লাইক হ্যান্ডলার
  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking || !onAction) return;
    try {
      setIsLiking(true);
      const token = await getAccessTokenSilently();
      await axios.put(`${API_URL}/api/posts/${post._id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onAction(); 
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // ২. কমেন্ট হ্যান্ডলার
  const handleCommentSubmit = async (e) => {
    if (e.key === "Enter" && commentText.trim()) {
      try {
        const token = await getAccessTokenSilently();
        await axios.post(`${API_URL}/api/posts/${post._id}/comment`, 
          { 
            text: commentText,
            userName: user?.name,
            userAvatar: user?.picture
          }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCommentText("");
        onAction(); 
      } catch (err) {
        console.error("Comment error:", err);
        alert("Failed to add comment");
        await axios.put(`${API_URL}/api/posts/${post._id}/like`, { userId: user.sub });
      }
    }
  };

  // ৩. ডিলিট হ্যান্ডলার
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this post?")) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${API_URL}/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onAction();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const isLiked = post.likes?.includes(user?.sub);

  return (
    <div className="bg-[#242526] rounded-xl shadow-md border border-[#3e4042] overflow-hidden mb-4 w-full">
      
      {/* হেডার */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.userName}&background=random`} 
            className="w-10 h-10 rounded-full border border-[#3e4042]" 
            alt="avatar" 
          />
          <div>
            <h4 className="font-bold text-[#e4e6eb] text-sm hover:underline cursor-pointer">{post.userName}</h4>
            <p className="text-xs text-[#b0b3b8]">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        {user?.sub === post.userId && (
          <button onClick={handleDelete} className="text-[#b0b3b8] hover:text-red-500 p-2 transition">
            <FaTrashAlt size={16} />
          </button>
        )}
      </div>

      {/* পোস্ট কন্টেন্ট */}
      <div className="px-4 pb-3">
        <p className="text-[#e4e6eb] text-[15px] leading-relaxed">{post.content}</p>
      </div>

      {/* ইমেজ */}
      {post.image && (
        <div className="bg-[#18191a] flex justify-center border-y border-[#3e4042]">
          <img 
            src={post.image} 
            className="max-h-[500px] w-full object-contain" 
            alt="post-media"
            onError={(e) => { e.target.src = "https://placehold.co/600x400/242526/b0b3b8?text=Image+Not+Found" }}
          />
        </div>
      )}

      {/* লাইক ও কমেন্ট কাউন্ট */}
      <div className="px-4 py-2 flex justify-between text-[#b0b3b8] text-sm">
        <div className="flex items-center gap-1">
          {post.likes?.length > 0 && <span className="bg-blue-600 rounded-full p-1 text-[10px] text-white">👍</span>}
          <span>{post.likes?.length || 0}</span>
        </div>
        <div className="hover:underline cursor-pointer" onClick={() => setShowComments(!showComments)}>
          {post.comments?.length || 0} comments
        </div>
      </div>

      {/* অ্যাকশন বাটনসমূহ */}
      <div className="px-2 py-1 flex items-center gap-2 border-t border-[#3e4042]">
        <button 
          onClick={handleLike} 
          disabled={isLiking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition hover:bg-[#3a3b3c] ${isLiked ? "text-[#f3425f]" : "text-[#b0b3b8]"}`}
        >
          {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
          <span className="font-semibold text-sm">Like</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition hover:bg-[#3a3b3c] text-[#b0b3b8]"
        >
          <FaRegComment size={18} />
          <span className="font-semibold text-sm">Comment</span>
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition hover:bg-[#3a3b3c] text-[#b0b3b8]">
          <FaShare size={18} />
          <span className="font-semibold text-sm">Share</span>
        </button>
      </div>

      {/* কমেন্ট সেকশন এরিয়া (ফুটারের নিচে) */}
      {showComments && (
        <div className="px-4 py-3 border-t border-[#3e4042] bg-[#242526]">
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
            {post.comments?.map((c, index) => (
              <div key={index} className="flex gap-2 items-start">
                <img 
                  src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}&background=random`} 
                  className="w-8 h-8 rounded-full mt-1" 
                  alt="avatar" 
                />
                <div className="bg-[#3a3b3c] p-2 rounded-2xl max-w-[90%]">
                  <h5 className="text-xs font-bold text-[#e4e6eb]">{c.userName}</h5>
                  <p className="text-sm text-[#e4e6eb] leading-snug">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <img src={user?.picture} className="w-8 h-8 rounded-full" alt="me" />
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 bg-[#3a3b3c] text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;