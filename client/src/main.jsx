import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./app.jsx";
import { AuthProvider } from "./context/AuthContext"; 
import "./index.css"; 

/**
 * 🔐 Auth0 Configuration (Verified from Screenshot)
 */
const AUTH0_DOMAIN = "dev-prxn6v2o08xp5loz.us.auth0.com";
const AUTH0_CLIENT_ID = "fPDZj5sDRTwv0EaH2woGlnmPwkpTCePF";
const API_AUDIENCE = "https://onyx-drift-api.com"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ১. BrowserRouter: React Router v7 এর জন্য ফিউচার ফ্ল্যাগসহ */}
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* ২. Auth0Provider: টোকেন ম্যানেজমেন্ট ও অথেন্টিকেশন */}
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
        {/* ৩. কাস্টম AuthProvider: আপনার ব্যাকএন্ডের গ্লোবাল স্টেট ম্যানেজমেন্ট */}
        <AuthProvider>
          {/* ৪. Suspense: অলসভাবে লোড হওয়া কম্পোনেন্টের জন্য গ্লোবাল লোডার */}
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