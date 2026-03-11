import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // ১. যদি অথেন্টিকেশন লোড হতে সময় নেয়, তবে একটি লোডিং স্ক্রিন দেখাবে
  // এটি না থাকলে অনেক সময় 'user' নাল (null) পায় এবং লুপ তৈরি হয়
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#020617] text-cyan-500 font-mono">
        ONYX_GATEKEEPER: AUTH_SYNCING...
      </div>
    );
  }

  // ২. যদি ইউজার লগইন করা না থাকে
  if (!user) {
    // ✅ এখানে '/login' এর বদলে '/' (রুট) দিন যদি আপনার লগইন পেজ ল্যান্ডিংয়ে থাকে
    // ✅ 'replace' ব্যবহার করা হয়েছে যাতে ব্রাউজার হিস্ট্রিতে লুপ না হয়
    // ✅ 'state' এর মাধ্যমে আগের লোকেশন সেভ রাখা হয়েছে যাতে লগইনের পর ফিরে আসা যায়
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ৩. ইউজার থাকলে চিলড্রেন কম্পোনেন্ট রেন্ডার করবে
  return children;
};

export default ProtectedRoute;
