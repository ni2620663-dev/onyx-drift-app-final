import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.jsx";
import "../index.css";

const AUTH0_DOMAIN = "dev-6d0nxccsaycctfl1.us.auth0.com";
const AUTH0_CLIENT_ID = "tcfTAHv3K8KC1VwtZQrqIbqsZRN2PJFr";
const API_AUDIENCE = "https://onyx-drift-api.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: API_AUDIENCE,
      }}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);
