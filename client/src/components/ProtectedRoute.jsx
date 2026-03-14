import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const location = useLocation();

  // যখন অ্যাপ লোড হচ্ছে, তখন অপেক্ষা করাটা জরুরি
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono tracking-widest uppercase">
        <div className="animate-pulse">ONYX_GATEKEEPER: SYNCING NEURAL DATA...</div>
      </div>
    );
  }

  // যদি ইউজার অথেন্টিকেটেড না হয়, তবে তাদের ল্যান্ডিং পেজে পাঠিয়ে দেওয়া হবে
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // সব ঠিক থাকলে চিলড্রেন কম্পোনেন্ট রেন্ডার করবে
  return children;
};

export default ProtectedRoute;