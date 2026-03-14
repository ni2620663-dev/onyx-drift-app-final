import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./app.jsx";
import { ContextProvider } from "./context/CallContext"; 
import "./index.css"; 
import 'regenerator-runtime/runtime';

/* ==========================================================
   🛠️ NODE.JS POLYFILLS (WebRTC & Buffer Fix)
========================================================== */
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;
window.process = { 
  env: { NODE_ENV: 'production' }, 
  browser: true 
};

// অথেনটিকেশন কনফিগারেশন - আপনার ড্যাশবোর্ড থেকে প্রাপ্ত
const auth0Domain = "dev-prxn6v2o08xp5loz.us.auth0.com";
const auth0ClientId = "fPDZj5sDRTWv0EaH2woGlnmPwkpTCePF";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin, // এটি অটোমেটিক http://localhost:5173 ধরবে
        audience: "https://onyx-drift-api.com"
      }}
      // ক্যাশ সমস্যা এড়াতে এটি যোগ করুন:
      cacheLocation="localstorage"
    >
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ContextProvider> 
          <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-widest uppercase animate-pulse">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                <span>Syncing Neural Interface...</span>
              </div>
            </div>
          }>
            <App />
          </Suspense>
        </ContextProvider>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);