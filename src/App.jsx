import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar.jsx";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft.jsx";
import SidebarRight from "./components/SidebarRight/SidebarRight.jsx";
import StoriesCarousel from "./components/StoriesCarousel/StoriesCarousel.jsx";
import CreatePost from "./components/CreatePost/CreatePost.jsx";
import PostFeed from "./components/PostFeed/PostFeed.jsx";


export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-500">
        <Navbar toggleDarkMode={toggleDarkMode} />
        <div className="flex max-w-7xl mx-auto gap-4 p-4">
          {/* Left Sidebar */}
          <SidebarLeft />

          {/* Center Feed */}
          <div className="flex-1 space-y-6">
            <StoriesCarousel />
            <CreatePost />
            <PostFeed />
          </div>

          {/* Right Sidebar */}
          <SidebarRight />
        </div>
      </div>
    </div>
  );
}
