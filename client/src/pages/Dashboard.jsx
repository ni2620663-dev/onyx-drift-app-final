import React, { useState } from "react";
import PostBox from "../components/PostBox";
import Feed from "../components/Feed";

const Dashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewPost = () => {
    // পোস্ট সফলভাবে তৈরি হলে ফিড রিফ্রেশ করবে
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* পোস্ট করার বক্স */}
        <PostBox onPostCreated={handleNewPost} />
        
        {/* পোস্টগুলোর ফিড */}
        <Feed refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Dashboard;