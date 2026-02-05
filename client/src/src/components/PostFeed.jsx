import React from "react";
import PostCard from "./PostCard";

const PostFeed = ({ posts, onAction }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-[#242526] rounded-xl shadow-md mt-4 border border-[#3e4042]">
        <div className="w-16 h-16 bg-[#3a3b3c] rounded-full flex items-center justify-center mb-4 text-2xl">
          📭
        </div>
        <h3 className="text-lg font-bold text-white">No posts yet</h3>
        <p className="text-[#b0b3b8] text-sm text-center">Follow someone or create a post to see updates!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onAction={onAction} />
      ))}
    </div>
  );
};

export default PostFeed;