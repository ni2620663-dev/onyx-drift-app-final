import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:10000/api', // আপনার স্প্রিং বুট পোর্ট
});

// ১. সব পোস্ট আনা
export const fetchPosts = () => API.get('/posts');

// ২. নতুন পোস্ট করা (মিডিয়াসহ)
export const createPost = (formData) => API.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// ৩. লগইন করা
export const login = (credentials) => API.post('/auth/login', credentials);

// ৪. ফলো করা
export const followUser = (followingUser, currentUser) => 
    API.post(`/follow/${followingUser}?currentUser=${currentUser}`);