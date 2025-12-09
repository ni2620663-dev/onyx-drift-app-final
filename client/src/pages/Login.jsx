import React, { useState } from "react";
import axios from "axios";

// প্রক্সি সার্ভিসের URL ব্যবহার করা হচ্ছে
const API_URL = "https://onyx-drift-api-server.onrender.com"; 
// অথবা আসল ব্যাকএন্ড URL: "https://onyx-drift-app-final.onrender.com"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // মেসেজ স্টেটটি পরিষ্কার করুন
    setMessage(""); 

    try {
      const res = await axios.post(
        `${API_URL}/api/login`, // প্রক্সি সার্ভারে রিকোয়েস্ট যাচ্ছে
        { email, password },
        { withCredentials: true }
      );
      
      // লগইন সফল হলে মেসেজ সেট করুন
      setMessage(res.data.message || "লগইন সফল হয়েছে! রিডাইরেক্ট হচ্ছে...");
      
      // 💡 লগইন সফল হলে রিডাইরেক্ট করুন (যেমন: 1 সেকেন্ড পরে)
      setTimeout(() => {
        window.location.href = '/feed'; 
      }, 1000);

    } catch (err) {
      // ব্যাকএন্ড থেকে আসা ত্রুটি মেসেজটি সঠিকভাবে ধরুন
      setMessage(err.response?.data?.msg || err.response?.data?.message || "লগইন ব্যর্থ হয়েছে। সার্ভার ত্রুটি।");
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold mb-4">OnyxDrift Login</h1> {/* টাইটেল পরিষ্কার করা হলো */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-64">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
      
      {/* ⚠️ যদি আপনার 'Demo Credentials' টেক্সট এইখানে থাকে, তবে আপনাকে এই কম্পোনেন্টের বাইরে অন্য কোথাও খুঁজতে হবে, কারণ এই ফাইলে সেটি নেই। */}
      
      {message && <p className="mt-4 text-red-500">{message}</p>}
      
      {/* রেজিস্ট্রেশন লিঙ্কটি নিশ্চিত করা হয়েছে */}
      <p className="mt-3 text-sm">
        অ্যাকাউন্ট নেই? {" "}
        <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
          একটি অ্যাকাউন্ট তৈরি করুন
        </a>
      </p>
    </div>
  );
};

export default Login;