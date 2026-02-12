import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./app.jsx";
import { AuthProvider } from "./context/AuthContext"; 
import "./index.css"; // নিশ্চিত করুন ফাইলটি সরাসরি src ফোল্ডারে আছে

/**
 * 🔐 Auth0 Configuration
 * প্রোডাকশন এবং লোকাল হোস্ট উভয় ডোমেইন এখানে সাপোর্ট করবে।
 */
const AUTH0_DOMAIN = "dev-prxn6v2o08xp5loz.us.auth0.com";
const AUTH0_CLIENT_ID = "fPDZj5sDRTwv0EaH2woGlnmPwkpTCePF";
const API_AUDIENCE = "https://onyx-drift-api.com"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ১. BrowserRouter: রাউটিং ফিচার এনাবল করার জন্য */}
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* ২. Auth0Provider: ইউজার অথেন্টিকেশন হ্যান্ডেল করার জন্য */}
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          // window.location.origin স্লাশ ছাড়া URL পাঠায় (যেমন: http://localhost:5173)
          redirect_uri: window.location.origin, 
          audience: API_AUDIENCE, 
          scope: "openid profile email offline_access"
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        {/* ৩. কাস্টম AuthProvider: আপনার ব্যাকএন্ডের সাথে ডেটা সিঙ্ক করার জন্য */}
        <AuthProvider>
          {/* ৪. Suspense: অলসভাবে লোড হওয়া (lazy loading) কম্পোনেন্টগুলোর জন্য লোডিং স্টেট */}
          <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-widest uppercase animate-pulse">
              Syncing Neural Interface...
            </div>
          }>
            <App />
          </Suspense>
        </AuthProvider>
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);