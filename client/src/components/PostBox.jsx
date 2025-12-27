import React, { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

const PostBox = ({ onPostCreated }) => {
  const { user } = useAuth0();
  const [content, setContent] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await axios.post(`${API_URL}/api/posts`, {
        userId: user.sub,
        userName: user.name,
        userAvatar: user.picture,
        content: content,
      });
      setContent("");
      onPostCreated(); // ড্যাশবোর্ডের ফিড রিফ্রেশ করবে
    } catch (err) {
      console.error("Post creation failed", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl outline-none resize-none"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostBox;