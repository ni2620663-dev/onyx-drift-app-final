// client/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // আপনার মূল অ্যাপ কম্পোনেন্ট
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

// === Auth0 কনফিগারেশন ভ্যালুগুলি ===
// সাধারণত এগুলো .env ফাইল থেকে নেওয়া হয়, তবে বোঝার সুবিধার জন্য সরাসরি ব্যবহার করা হলো।
// যদি আপনি .env ব্যবহার করেন, তবে process.env.VITE_AUTH0_DOMAIN ইত্যাদি ব্যবহার করুন।
const AUTH0_DOMAIN = 'dev-6d0nxccsaycctfl1.us.auth0.com'; // আপনার দেওয়া বেস ডোমেইন
const AUTH0_CLIENT_ID = 'আপনার-Auth0-ক্লায়েন্ট-আইডি'; // <--- এখানে আপনার Client ID দিন
const API_AUDIENCE = 'https://onyx-drift-api.com'; // আপনার দেওয়া API Audience

// ===

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        // লগইন সফল হওয়ার পর ব্যবহারকারীকে কোথায় ফেরত পাঠানো হবে
        redirect_uri: window.location.origin, 
        
        // এটি সবচেয়ে গুরুত্বপূর্ণ!
        // এটি নিশ্চিত করে যে Access Token-এ আপনার ব্যাকএন্ড API-এর Audience থাকবে।
        audience: API_AUDIENCE, 
        
        // যদি আপনি Auth0-এর Management API-এর জন্য বিশেষ স্কোপ চান:
        // scope: 'read:current_user update:current_user_metadata'
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>,
);