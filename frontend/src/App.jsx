import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './components/Login';
import Register from './components/Register';
import PostFeed from './components/PostFeed';
import PostForm from './components/PostForm';
import Trending from './components/Trending';
import PersonalizedFeed from './components/PersonalizedFeed';
import MediaUploader from './components/MediaUploader';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [posts, setPosts] = useState([]); // store posts

  // Function to handle new post from PostForm
  const handleNewPost = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  if (!user) {
    return showRegister 
      ? <Register onRegister={(name) => setUser(name)} /> 
      : <Login onLogin={(name) => setUser(name)} />;
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ padding: "20px" }}>
        <Home />
        <PostForm user={user} onNewPost={handleNewPost} />
        <PostFeed posts={posts} />
        <Trending />
        <PersonalizedFeed user={user} />
        <MediaUploader />
      </main>
    </div>
  );
}

export default App;
