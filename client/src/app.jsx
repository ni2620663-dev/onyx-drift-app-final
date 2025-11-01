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
import Call from "./components/Call/Call";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const [userId] = useState("user1");     // demo user
  const [receiverId] = useState("user2");
  const [callRoomId] = useState("room123");

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          {/* Messenger & Call Demo Route */}
          <Route
            path="/chat"
            element={<Chat userId={userId} receiverId={receiverId} />}
          />
          <Route path="/call" element={<Call roomId={callRoomId} />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
