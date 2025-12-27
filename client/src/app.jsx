import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";

// Components & Pages
import Sidebar from "./components/Sidebar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Profile from "./components/Profile";
import SettingsPage from "./pages/SettingsPage";
import Explore from "./pages/Explore"; 
import Messenger from "./pages/Messenger";
import VideoCall from "./pages/VideoCall";

/* Protected Route Wrapper */
const ProtectedRoute = ({ component }) => {
  const Component = withAuthenticationRequired(component, { 
    onRedirecting: () => <div className="p-10 text-center dark:text-white">Redirecting to login...</div> 
  });
  return <Component />;
};

export default function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();

  // ভিডিও কল চলাকালীন সাইডবার লুকানোর লজিক
  const isVideoCall = location.pathname.startsWith('/call/');

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center font-bold bg-white dark:bg-gray-900 dark:text-white">
        Loading OnyxDrift...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ১. সাইডবার: শুধুমাত্র লগইন থাকলে এবং ভিডিও কল না চললে দেখাবে */}
      {isAuthenticated && !isVideoCall && <Sidebar />}

      {/* ২. মেইন কন্টেন্ট এরিয়া: সাইডবারের জন্য ml-20 মার্জিন দেওয়া হয়েছে */}
      <main className={`flex-1 transition-all duration-300 ${isAuthenticated && !isVideoCall ? "ml-20" : "ml-0"}`}>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Landing />} />

          {/* Protected Routes */}
          <Route path="/feed" element={<ProtectedRoute component={Dashboard} />} />
          <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
          <Route path="/explore" element={<ProtectedRoute component={Explore} />} /> 
          <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
          <Route path="/settings" element={<ProtectedRoute component={SettingsPage} />} />
          <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
          
          {/* Video Call Route */}
          <Route path="/call/:roomId" element={<ProtectedRoute component={VideoCall} />} />
          
          {/* 404 Page */}
          <Route path="*" element={<h2 className="p-10 text-center text-2xl dark:text-white">404 - Page Not Found</h2>} />
        </Routes>
      </main>
    </div>
  );
}