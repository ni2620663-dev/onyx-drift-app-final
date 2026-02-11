import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./app.jsx";
import { AuthProvider } from "./context/AuthContext"; 
import "./index.css";

/**
 * 🔐 Auth0 Configuration
 * নতুন একাউন্টের তথ্য এখানে আপডেট করা হয়েছে।
 */
const AUTH0_DOMAIN = "dev-prxn6v2o08xp5loz.us.auth0.com";
const AUTH0_CLIENT_ID = "fPDZj5sDRTwv0EaH2woGlnmPwkpTCePF";
const API_AUDIENCE = "https://onyx-drift-api.com"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ১. BrowserRouter সবার উপরে থাকবে যেন নিচের সব কম্পোনেন্ট রাউট এক্সেস পায় */}
    <BrowserRouter>
      {/* ২. Auth0Provider রাউটারের ভেতরে থাকবে যেন redirect_uri ঠিকমতো কাজ করে */}
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: API_AUDIENCE, 
          scope: "openid profile email offline_access"
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        {/* ৩. আপনার কাস্টম AuthProvider সবশেষে অ্যাপের ডেটা কন্ট্রোল করবে */}
        <AuthProvider>
          {/* ৪. Suspense যোগ করা হয়েছে যেন থ্রি-ডি বা চাস্ক ফাইল লোড হওয়ার সময় 'S' এরর না দেয় */}
          <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono">
              SYNCING NEURAL INTERFACE...
            </div>
          }>
            <App />
          </Suspense>
        </AuthProvider>
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);