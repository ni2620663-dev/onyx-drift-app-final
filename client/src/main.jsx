import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app.jsx";
import { ContextProvider } from "./context/CallContext"; 
import "./index.css"; 
import 'regenerator-runtime/runtime';
import { Auth0Provider } from '@auth0/auth0-react';
import { Buffer } from 'buffer';

/* NODE.JS POLYFILLS */
window.Buffer = Buffer;
window.global = window;
window.process = { env: { NODE_ENV: 'production' }, browser: true };

/* Auth0 কনফিগারেশন - [FIXED] */
const domain = "dev-ds5qpkme1dcprm7y.us.auth0.com";
// Client ID-তে 'f' ছোট হাতের এবং 'K' বড় হাতের হবে
const clientId = "GY0nq3w9kUo1g9Hs6kJ5iwGWOsiHtNAG"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        // আপনার ড্যাশবোর্ড অনুযায়ী ড্যাশ (-) থাকবে না
         audience: "https://onyx-drift-api",
        scope: "openid profile email"
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ContextProvider> 
          <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono uppercase animate-pulse">Syncing...</div>}>
            <App />
          </Suspense>
        </ContextProvider>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);