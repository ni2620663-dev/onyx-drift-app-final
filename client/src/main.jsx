import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app.jsx";
import { ContextProvider } from "./context/CallContext"; 
import "./index.css"; 
import 'regenerator-runtime/runtime';

/* ==========================================================
   🛠️ NODE.JS POLYFILLS (WebRTC Fix)
========================================================== */
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;
window.process = { 
  env: { NODE_ENV: 'production' }, 
  browser: true 
};

// নোটিফিকেশন পারমিশন
if (typeof window !== "undefined" && "Notification" in window) {
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* এখানে Auth0Provider এর প্রয়োজন নেই, কারণ আমরা সরাসরি Supabase ব্যবহার করছি।
        আপনার আগের AuthProvider যদি Supabase এর সাথে কানেক্টেড থাকে তবে সেটি রাখুন, 
        অন্যথায় সরাসরি ContextProvider ব্যবহার করুন।
      */}
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
  </React.StrictMode>
);