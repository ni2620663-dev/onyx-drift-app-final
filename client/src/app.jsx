import React, { useState, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// --- API Configuration ---
const RENDER_API_URL = "https://onyx-drift-api-server.onrender.com";
const LOCAL_API_URL = "http://localhost:5000";
const API_BASE_URL = window.location.hostname === "localhost" ? LOCAL_API_URL : RENDER_API_URL;

// --- Dummy Components and Context (Keep these for functionality) ---
const Navbar = () => (<div className="bg-blue-600 p-4 text-white text-center">OnyxDrift Nav</div>);
const Home = () => (<h1 className="text-3xl text-center mt-8">Welcome Home (Feed)</h1>);
const Chat = ({ userId, receiverId }) => (<h2 className="text-xl text-center mt-4">Chat with {receiverId} (User ID: {userId})</h2>);
const Profile = ({ userId }) => (<h2 className="text-xl text-center mt-4">Profile for User: {userId}</h2>);
const Pages = ({ name }) => (<h2 className="text-xl text-center mt-4">{name} Page</h2>);

// Auth Context
const AuthContext = React.createContext({ userId: null, setUserId: () => {} });
const useAuth = () => React.useContext(AuthContext);

// 1. AuthProvider এখন App এর বাইরে থাকবে (বা উপরে)
const AuthProvider = ({ children }) => {
    const [userId, setUserId] = useState(null); 
    // Demo State: localStorage থেকে userId নেওয়ার লজিক এখানে যুক্ত করা যেতে পারে
    const value = useMemo(() => ({ userId, setUserId }), [userId]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 2. ProtectedRoute কম্পোনেন্ট এখন useAuth ব্যবহার করে কাজ করবে
const ProtectedRoute = ({ children }) => {
    const { userId } = useAuth();
    if (!userId) {
        // লগইন না থাকলে, ইউজারকে /login এ পাঠাবে
        return <Navigate to="/login" replace />;
    }
    return children;
};
// --- End Dummy Components ---

// 3. Login Component কে আলাদা করে তৈরি করা হলো
const LoginComponent = () => {
    const { userId, setUserId } = useAuth(); // Auth context থেকে userId and setUserId আনবে
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(""); 
    
    // যদি ইতিমধ্যেই লগইন করা থাকে, তবে ব্যবহারকারীকে /feed এ নিয়ে যাবে
    if (userId) {
        return <Navigate to="/feed" replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(""); 
        try {
            const res = await axios.post(`${API_BASE_URL}/api/login`, {
                email,
                password,
            });
            // সফল হলে setUserId আপডেট করবে
            setUserId(res.data.user.id); 
            // Note: এখানে localStorage/sessionStorage এ token সেভ করার লজিক দরকার
        } catch (err) {
            setLoginError(err.response?.data?.message || "Login failed. Check server connection.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
                <h1 className="text-3xl font-extrabold text-blue-600 mb-6 text-center">OnyxDrift Login V2</h1> {/* Title Change! */}
                <form
                    onSubmit={handleLogin}
                    className="flex flex-col gap-4"
                >
                    {loginError && (
                        <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
                            {loginError}
                        </div>
                    )}
                    <input
                        type="email"
                        placeholder="Email (test@example.com)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password (123456)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-150"
                        required
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md hover:shadow-lg"
                    >
                        Login
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-4">
                    Demo Credentials: test@example.com / 123456
                </p>

                {/* ⭐ আপনার কাঙ্ক্ষিত "Create Account" লিঙ্কটি এখন ডেডিকেটেড Login কম্পোনেন্টে ⭐ */}
                <p className="text-center text-sm mt-3">
                    অ্যাকাউন্ট নেই? {" "}
                    <a 
                        href="/register" 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        একটি অ্যাকাউন্ট তৈরি করুন
                    </a>
                </p>

            </div>
        </div>
    );
}

// 4. Registration Component (dummy for now)
const RegisterComponent = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
            <h1 className="text-3xl font-extrabold text-green-600 mb-6">Registration Page</h1>
            <p className="text-gray-700">Registration form goes here.</p>
            <p className="text-sm mt-4">
                ইতিমধ্যে অ্যাকাউন্ট আছে? {" "}
                <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                    লগইন করুন
                </a>
            </p>
        </div>
    </div>
);


function App() {
    // App কম্পোনেন্টটি এখন শুধুমাত্র রাউটিং এবং গ্লোবাল লেআউট হ্যান্ডেল করবে। 
    // AuthProvider, Router-কে র্যাপ করছে।
    
    // receiverId
    const [receiverId] = useState("user2");

    // Login/Auth state context থেকে আসবে, এখানে App এর মধ্যে রাখার দরকার নেই। 
    // কিন্তু ডামি কম্পোনেন্টগুলির কারণে এটিকে অস্থায়ীভাবে রাখছি:
    const { userId } = useAuth(); 

    return (
        <Router>
            <Navbar />
            <div className="container mx-auto p-4">
                <Routes>
                    {/* Protected Routes - লগইন না থাকলে /login এ যাবে */}
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/feed" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><Pages name="Friends" /></ProtectedRoute>} />
                    <Route path="/groups" element={<ProtectedRoute><Pages name="Groups" /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute><Pages name="Events" /></ProtectedRoute>} />
                    <Route path="/marketplace" element={<ProtectedRoute><Pages name="Marketplace" /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Chat userId={userId} receiverId={receiverId} /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile userId={userId} /></ProtectedRoute>} />
                    
                    {/* Public Routes - সবাই অ্যাক্সেস করতে পারবে */}
                    <Route path="/login" element={<LoginComponent />} /> 
                    <Route path="/register" element={<RegisterComponent />} /> 
                </Routes>
            </div>
        </Router>
    );
}


// AuthProvider রুট কম্পোনেন্টকে র্যাপ করবে (index.js এ)
// যেহেতু index.js ফাইলটি এখানে নেই, তাই আমরা এটি এখানে ম্যানুয়ালি তৈরি করছি:
function Root() {
    return (
        <AuthProvider>
            <App />
        </AuthProvider>
    );
}

export default Root;