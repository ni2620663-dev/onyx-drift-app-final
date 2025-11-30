import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Friends from "./pages/Friends";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Chat from "./components/Chat/Chat";
import call from "./components/CallBar"
import Chat from "./components/Chat/Chat";
import Profile from "./components/Profile";
import { AuthProvider } from "./context/AuthContext";
import axios from "axios";

function App() {
  // Auth & Demo state
  // 💡 পরিবর্তন: Login বাইপাস করার জন্য userId-এ একটি ডিফল্ট মান সেট করা হলো
  const [userId, setUserId] = useState("temp_user_id"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [receiverId] = useState("user2"); // demo chat
  // const [callRoomId] = useState("room123"); // DELETED: demo call

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });
      setUserId(res.data._id);
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  if (!userId) {
    // এই ব্লকটি এখন আর দেখা যাবে না, কারণ userId সেট করা হয়েছে।
    return (
      <div className="flex flex-col items-center mt-10">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 w-64"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // Main App after login
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={<Chat userId={userId} receiverId={receiverId} />}
          />
          <Route
            path="/profile"
            element={<Profile userId={userId} />}
          />
        </Routes>
        
        {/* আপনি যে div ব্লকটি রেন্ডার করতে চান না, সেটি অ্যাপের মূল রিটার্ন থেকে সরানো হলো */}
        
      </Router>
    </AuthProvider>
  );
}

export default App;