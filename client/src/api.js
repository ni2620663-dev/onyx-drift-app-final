import axios from 'axios';

const BASE_URL = "http://localhost:10000/api"; // আপনার ব্যাকএন্ড পোর্ট

const api = axios.create({
    baseURL: BASE_URL,
});

// ১. পোস্ট করার জন্য (Point 7: Media Support)
export const createPost = (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// ২. টাইমলাইন দেখার জন্য (Point 8: Feed System)
export const getTimeline = (username) => api.get(`/posts/timeline?username=${username}`);

// ৩. ট্রেন্ডিং ট্যাগ দেখার জন্য (Point 3: Trends)
export const getTrending = () => api.get('/posts/trending');

// ৪. ফলো করার জন্য
export const followUser = (followingUser, currentUser) => 
    api.post(`/follow/${followingUser}?currentUser=${currentUser}`);

// ৫. লগইন ও রেজিস্ট্রেশন (Point 9: Auth)
export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);

export default api;