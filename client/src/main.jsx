import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./app.jsx";
import { AuthProvider } from "./context/AuthContext"; 
import { ContextProvider } from "./context/CallContext"; 
import "./index.css"; 

// --- 🛠️ NODE.JS POLYFILLS FOR BROWSER (Vite/WebRTC Fix) ---
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;
window.process = { env: { NODE_ENV: 'production' }, browser: true };

/**
 * 🔐 Auth0 Configuration
 */
const AUTH0_DOMAIN = "dev-prxn6v2o08xp5loz.us.auth0.com";
const AUTH0_CLIENT_ID = "fPDZj5sDRTwv0EaH2woGlnmPwkpTCePF";
const API_AUDIENCE = "https://onyx-drift-api.com"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ১. BrowserRouter: রাউটিং ম্যানেজমেন্ট */}
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* ২. Auth0Provider: অথেন্টিকেশন */}
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
        {/* ৩. কাস্টম AuthProvider: ইউজার ডাটা হ্যান্ডলিং */}
        <AuthProvider>
          {/* ৪. Call ContextProvider: ভিডিও/অডিও কলের গ্লোবাল স্টেট */}
          <ContextProvider> 
            <Suspense fallback={
              <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-widest uppercase animate-pulse">
                Syncing Neural Interface...
              </div>
            }>
              <App />
            </Suspense>
          </ContextProvider>
        </AuthProvider>
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);