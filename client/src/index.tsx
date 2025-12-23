// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
const AUTH0_DOMAIN = 'dev-6d0nxccsaycctfl1.us.auth0.com';
const AUTH0_CLIENT_ID = 'tcfTAHv3K8KC1VwtZQrqIbqsZRN2PJFr';
const API_AUDIENCE = 'https://onyx-drift-api.com';
const root = createRoot(document.getElementById('root')!);

root.render(
  <Auth0Provider
    domain={AUTH0_DOMAIN}
    clientId={AUTH0_CLIENT_ID}
    useRefreshTokens={true}
    useRefreshTokensFallback={false}
    authorizationParams={{
      // Auth0 Callback URL
      redirect_uri: `${PACKAGE_ID}://${AUTH0_DOMAIN}/capacitor/${PACKAGE_ID}/callback`
    }}
  >
    <App />
  </Auth0Provider>
);