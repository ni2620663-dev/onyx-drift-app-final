import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { useAuth0 } from '@auth0/auth0-react';

// Hooks & Components
import Sidebar from "./components/Sidebar";
import CustomCursor from "./components/CustomCursor";
import MobileNav from "./components/MobileNav";

// Lazy Pages
const Messenger = lazy(() => import("./pages/Messenger"));
const PremiumHomeFeed = lazy(() => import("./pages/PremiumHomeFeed"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings")); 
const ReelsFeed = lazy(() => import("./pages/ReelsFeed"));
const Landing = lazy(() => import("./pages/Landing"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const CallPage = lazy(() => import("./pages/CallPage"));

// Placeholders
const Analytics = () => <div className="p-10 text-cyan-500 font-mono">NEURAL_ANALYTICS_V1</div>;
const Explore = () => <div className="p-10 text-cyan-500 font-mono">EXPLORING_GRID_WAVES...</div>;
const CreatePost = () => <div className="p-10 text-cyan-500 font-mono">INITIALIZING_CONTENT_SYNTHESIZER...</div>;

export default function App() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth0();

  // ১. লোডিং স্টেট (এখানে কোন সাইডবার বা ন্যাভবার থাকবে না)
  if (isLoading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-mono tracking-widest uppercase">
      Booting_Neural_Interface...
    </div>
  );

  const isFullWidthPage = ["/", "/join"].includes(location.pathname);
  const showNav = !isFullWidthPage && isAuthenticated;

  return (
    <div className="min-h-screen bg-[#020617] text-gray-200 selection:bg-cyan-500/30 overflow-x-hidden relative">
      <Toaster position="top-right" />
      
      {/* কাস্টম কার্সারে অবশ্যই 'pointer-events-none' থাকতে হবে যেন ক্লিক আটকানো না যায় */}
      <CustomCursor />
      
      <div className="flex w-full min-h-screen relative">
        {/* ২. Desktop Sidebar (Z-index 50) */}
        {showNav && (
          <aside className="hidden md:block fixed left-0 top-0 h-full w-64 z-[50] bg-[#020617]/90 backdrop-blur-md border-r border-cyan-900/20">
            <Sidebar />
          </aside>
        )}
        
        {/* ৩. Mobile Navigation Bar */}
        {/* নোট: MobileNav-এর ভেতরেই 'fixed' এবং 'z-index' আছে, তাই এখানে বাড়তি 'nav' ট্যাগ দরকার নেই */}
        {showNav && <MobileNav />}
        
        {/* ৪. Dynamic Content Area */}
        <main 
          className={`flex-1 min-h-screen transition-all duration-500 
            ${showNav ? 'md:pl-64 pb-24' : ''} 
            relative z-10`}
        >
          <Suspense fallback={
            <div className="h-full w-full min-h-screen flex items-center justify-center text-cyan-500 animate-pulse font-mono tracking-widest">
              SYNCING_NEURAL_LINK...
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Landing />} />
              <Route path="/join" element={isAuthenticated ? <Navigate to="/feed" replace /> : <JoinPage />} />
              
              {/* Navigation Routes */}
              <Route path="/feed" element={isAuthenticated ? <PremiumHomeFeed /> : <Navigate to="/" replace />} />
              <Route path="/reels" element={isAuthenticated ? <ReelsFeed /> : <Navigate to="/" replace />} />
              <Route path="/following" element={isAuthenticated ? <PremiumHomeFeed /> : <Navigate to="/" replace />} />
              <Route path="/analytics" element={isAuthenticated ? <Analytics /> : <Navigate to="/" replace />} />
              <Route path="/messages" element={isAuthenticated ? <Messenger /> : <Navigate to="/" replace />} />
              <Route path="/explorer" element={isAuthenticated ? <Explore /> : <Navigate to="/" replace />} />
              
              <Route path="/create" element={isAuthenticated ? <CreatePost /> : <Navigate to="/" replace />} />
              
              {/* Other Routes */}
              <Route path="/profile/:username" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/" replace />} />
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" replace />} />
              <Route path="/call" element={isAuthenticated ? <CallPage /> : <Navigate to="/" replace />} />
              
              {/* Catch-all Route */}
              <Route path="*" element={<Navigate to={isAuthenticated ? "/feed" : "/"} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
