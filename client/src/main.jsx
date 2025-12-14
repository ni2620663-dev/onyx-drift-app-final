// client/src/main.jsx (সঠিক)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // আপনার মূল অ্যাপ কম্পোনেন্ট
import '../index.css';
import { BrowserRouter } from 'react-router-dom'; // <--- এখানে ইম্পোর্ট করা হয়েছে
import { Auth0Provider } from '@auth0/auth0-react';

// === Auth0 কনফিগারেশন ভ্যালুগুলি ===
const AUTH0_DOMAIN = 'dev-6d0nxccsaycctfl1.us.auth0.com';
const AUTH0_CLIENT_ID = 'otYkcadaICKsUeabFk9qaj7wXmM4uYBZ';
const API_AUDIENCE = 'https://onyx-drift-api.com';

// ===

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin, 
        audience: API_AUDIENCE, 
      }}
    >
      {/* রাউটার এখানে রয়েছে */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);