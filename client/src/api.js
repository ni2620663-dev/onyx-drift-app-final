import axios from "axios";

// API Base URL (আপনার লাইভ Render ব্যাকএন্ড URL)
// এটি সমস্ত API কলের জন্য শুরু বিন্দু হিসেবে কাজ করবে।
const LIVE_BACKEND_URL = "https://onyxdrift-backend-13vz.onrender.com/api"; 

// Axios instance তৈরি করা হয়েছে
const API = axios.create({
  // baseURL এখন লাইভ Render URL এ সেট করা হয়েছে
  baseURL: LIVE_BACKEND_URL, 
});

// ================= POSTS =================

export const fetchPosts = () => API.get("/posts");

export const createPost = (formData, token) =>
  API.post("/posts", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Personalized posts
export const fetchPersonalizedPosts = (token) =>
  API.get("/posts/personalized", {
    headers: { Authorization: `Bearer ${token}` },
  });

// ================= AUTH =================

export const registerUser = (data) => API.post("/auth/register", data);

export const loginUser = (data) => API.post("/auth/login", data);

export const getCurrentUser = (token) =>
  API.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });