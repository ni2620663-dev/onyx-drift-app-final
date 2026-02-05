import axios from 'axios';

const API_URL = "https://onyx-drift-app-final.onrender.com"; // আপনার backend URL

export const login = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/api/login`, { email, password }, { withCredentials: true });
    return res.data;
  } catch (err) {
    console.error(err.response?.data || err.message);
    return null;
  }
};
