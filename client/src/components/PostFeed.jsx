import React from "react";
import PostCard from "./PostCard";

const PostFeed = ({ posts }) => {
  return (
    <div className="flex-1 p-4">
      {posts.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostFeed;
