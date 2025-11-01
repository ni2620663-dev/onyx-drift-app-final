import React from "react";

const PostCard = ({ post }) => {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold">{post.title}</h3>
      <p>{post.content}</p>
    </div>
  );
};

export default PostCard;
