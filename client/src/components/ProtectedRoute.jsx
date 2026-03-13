// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    return <div className="text-cyan-500">ONYX_GATEKEEPER: SYNCING...</div>;
  }

  if (!isAuthenticated) {
    // লুপ এড়াতে সরাসরি হোমপেজে না পাঠিয়ে লগইন ফ্লো ঠিক রাখা
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
export default ProtectedRoute;