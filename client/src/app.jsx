import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Profile from "./components/Profile";
import SettingsPage from "./pages/SettingsPage";
import Explore from "./pages/Explore"; // ১. নতুন ফাইলটি ইম্পোর্ট করুন
import Messenger from "./pages/Messenger";
import VideoCall from "./pages/VideoCall";
/* Navbar */
const Navbar = () => {
  useEffect(() => {
  socket.current?.on("getCallInvite", (data) => {
    const confirmCall = window.confirm(`${data.senderName} আপনাকে ভিডিও কল দিচ্ছেন। রিসিভ করবেন?`);
    if (confirmCall) {
      window.location.href = `/call/${data.roomId}`;
    }
  });
}, [socket.current]);
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
      <div className="flex gap-6">
        <NavLink to="/" className={({ isActive }) => isActive ? "font-bold border-b-2" : ""}>Home</NavLink>
        {isAuthenticated && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "font-bold border-b-2" : ""}>Dashboard</NavLink>
            <NavLink to="/explore" className={({ isActive }) => isActive ? "font-bold border-b-2" : ""}>Explore</NavLink> {/* ২. লিঙ্ক যোগ করুন */}
            <NavLink to="/profile" className={({ isActive }) => isActive ? "font-bold border-b-2" : ""}>Profile</NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "font-bold border-b-2" : ""}>Settings</NavLink>
          </>
        )}
      </div>
      <div>
        {/* Login/Logout buttons... */}
      </div>
    </nav>
  );
};

/* Protected Route Wrapper */
const ProtectedRoute = ({ component }) => {
  const Component = withAuthenticationRequired(component, { 
    onRedirecting: () => <div className="p-10 text-center">Redirecting to login...</div> 
  });
  return <Component />;
};

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* প্রটেক্টেড রুটস */}
        <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
        <Route path="/explore" element={<ProtectedRoute component={Explore} />} /> {/* ৩. রুট রেজিস্টার করুন */}
        <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
        <Route path="/settings" element={<ProtectedRoute component={SettingsPage} />} />
        <Route path="/messenger" element={<ProtectedRoute component={Messenger} />} />
        <Route path="*" element={<h2 className="p-10 text-center text-2xl">404 - Page Not Found</h2>} />
        <Route path="/call/:roomId" element={<ProtectedRoute component={VideoCall} />} />
        <Route path="/call/:roomId" element={<Call />} />
      </Routes>
    </>
  );
}