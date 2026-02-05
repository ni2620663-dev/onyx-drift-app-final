// src/pages/Onboarding.jsx

import React, { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const { user } = useAuth0();
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  // 🚀 এই সেই ফাংশন যা আপনি জানতে চেয়েছেন
  const handleCompleteSignup = async () => {
    if (!nickname) return alert("Please enter a nickname");

    try {
      // ১. localStorage থেকে জমানো রেফারেল কোডটি নিন (যা JoinPage সেট করেছিল)
      const savedRefCode = localStorage.getItem("referralCode");

      // ২. ব্যাকএন্ডে পাঠানোর জন্য ডাটা তৈরি করুন
      const payload = {
        nickname: nickname,
        auth0Id: user.sub,
        referralCode: savedRefCode // এটি ব্যাকএন্ডের লজিককে ট্রিগার করবে
      };

      // ৩. আপনার API কল করুন
      const API_URL = "https://onyx-drift-app-final.onrender.com";
      await axios.post(`${API_URL}/api/user/register`, payload);
      
      // ৪. কাজ শেষ হলে রেফারেল কোডটি মুছে ফেলুন
      localStorage.removeItem("referralCode");

      // ৫. সফল হলে ফিড বা প্রোফাইলে পাঠিয়ে দিন
      navigate("/feed");
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  return (
    <div className="onboarding-container">
      <input 
        type="text" 
        value={nickname} 
        onChange={(e) => setNickname(e.target.value)} 
        placeholder="Choose your drifter name"
      />
      <button onClick={handleCompleteSignup}>Initialize Sync</button>
    </div>
  );
};