import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../components/Sidebar";
import PostFeed from "../components/PostFeed";
import MediaUploader from "../components/MediaUploader";
import { fetchPersonalizedPosts } from "../api";
import { AuthContext } from "../context/AuthContext";

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
