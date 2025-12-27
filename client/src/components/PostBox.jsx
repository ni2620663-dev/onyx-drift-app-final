import React from 'react';

const PostBox = ({ onPostCreated }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-6">
      <h3 className="text-gray-500">What's on your mind?</h3>
      {/* এখানে আপনার পোস্ট তৈরির ইনপুট থাকবে */}
    </div>
  );
};

export default PostBox;