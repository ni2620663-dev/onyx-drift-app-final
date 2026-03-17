import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = "https://onyx-drift-app-final-u29m.onrender.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // অ্যাপ ওপেন হলে চেক করবে ইউজার আগে থেকে লগইন কি না
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // লগইন ফাংশন (আপনার সার্ভারের সাথে কানেক্ট হবে)
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Login Failed" };
    }
  };

  // লগআউট ফাংশন
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// এই হুকটি দিয়ে আপনি যেকোনো ফাইল থেকে ইউজারের ডাটা পাবেন (যেমন useAuth0 এর মতো)
export const useAuth = () => useContext(AuthContext);