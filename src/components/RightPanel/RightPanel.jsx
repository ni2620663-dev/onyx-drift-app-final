import React, { useState } from "react";
import Navbar from "../Navbar/Navbar.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import FriendList from "../FriendList/FriendList.jsx";
import Stories from "../Stories/Stories.jsx";
import ProfilePage from "../ProfilePage/ProfilePage.jsx";
import AuthForm from "../AuthForm/AuthForm.jsx";
import PostFeed from "../PostFeed/PostFeed.jsx";
import Trending from "../Trending/Trending.jsx";
import Search from "../Search/Search.jsx";
import PersonalizedFeed from "../PersonalizedFeed/PersonalizedFeed.jsx";
import StoriesCarousel from "../StoriesCarousel/StoriesCarousel.jsx";
import PostReactions from "../PostReactions/PostReactions.jsx";
import AIRecommendations from "../AIRecommendations/AIRecommendations.jsx";
import AdminPanel from "../AdminPanel/AdminPanel.jsx";
import Notifications from "../Notifications/Notifications.jsx";
import CreatePost from "../CreatePost/CreatePost.jsx";

import axios from "axios";

export default function RightPanel() {
  const [token, setToken] = useState(null);

  if (!token) return <AuthForm onLogin={(t) => setToken(t)} />;

  return (
    <div className="right-panel flex flex-col gap-4">
      <Navbar />
      <Sidebar />
      <FriendList />
      <Stories />
      <ProfilePage />
      <PostFeed />
      <Trending />
      <Search />
      <PersonalizedFeed />
      <StoriesCarousel />
      <PostReactions />
      <AIRecommendations />
      <AdminPanel />
      <Notifications />
      <CreatePost />
    </div>
  );
}
