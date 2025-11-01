// src/api.js
import axios from "axios";

// Axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api",
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
