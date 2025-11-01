import React, { useState, useEffect } from "react";

export default function PostFeed() {
  // State to hold the list of posts
  const [posts, setPosts] = useState([]);
  // State to hold the text of the new post being typed
  const [newPost, setNewPost] = useState("");
  // State to hold the WebSocket connection instance
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // 1. Fetch existing posts when the component mounts
    fetchPosts();

    // 2. Connect WebSocket for real-time updates
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/posts");
    
    // When a message is received (a new post from another user)
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Add the new post to the top of the feed
      setPosts(prev => [message, ...prev]); 
    };

    setWs(socket);

    // 3. Cleanup: Close the WebSocket connection when the component unmounts
    return () => socket.close();
  }, []); // Empty dependency array ensures this runs only once

  // Function to fetch posts from the REST API
  const fetchPosts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/posts");
      const data = await res.json();
      // Assuming data.posts is an array, we reverse it to show the newest posts first
      setPosts(data.posts.reverse()); 
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  // Function to handle adding a new post
  const handleAddPost = async () => {
    if (!newPost.trim()) return; // Prevent posting empty text

    try {
      // 1. Send the new post to the REST API
      const res = await fetch("http://127.0.0.1:8000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Placeholder user for demonstration
        body: JSON.stringify({ user: "current_user", text: newPost.trim() }) 
      });
      
      const data = await res.json();
      
      // 2. Send the newly created post data via WebSocket to notify other connected clients
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }

      // 3. Update the local state with the new post
      setPosts(prev => [data, ...prev]);
      
      // 4. Clear the input field
      setNewPost("");
      
    } catch (error) {
      console.error("Error adding post:", error);
      // Optional: Show an error message to the user
    }
  };

  return (
    <section className="postfeed" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Post Input Section */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex' }}>
        <input
          placeholder="What's on your mind?"
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          style={{ flexGrow: 1, padding: '10px', marginRight: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button 
          onClick={handleAddPost} 
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Post
        </button>
      </div>

      {/* Posts Feed */}
      {posts.map(post => (
        <article 
          key={post.id} 
          style={{ padding: '15px', marginBottom: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        >
          <strong style={{ display: 'block', marginBottom: '5px', color: '#007bff' }}>@{post.user}</strong>
          <p style={{ margin: 0 }}>{post.text}</p>
        </article>
      ))}
      
      {posts.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No posts yet. Be the first to post!</p>}
    </section>
  );
}