import axios from 'axios';

// আপনার সঠিক ব্যাকএন্ড ইউআরএল এখানে দিন
const API_BASE_URL = "https://onyx-drift-api-server.onrender.com/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data", // ইমেজ আপলোডের জন্য এটি জরুরি
  },
});

export default apiClient;