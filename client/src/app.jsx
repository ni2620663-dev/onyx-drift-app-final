// client/src/Root.jsx (বা আপনার মূল ফাইল যেখানে Auth0Provider থাকে)

import React, { useState, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Auth0 থেকে প্রয়োজনীয় হুক আমদানি করুন
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react"; 

// --- API Configuration ---
// আপনার API রুট যা সুরক্ষিত
const RENDER_API_URL = "https://onyx-drift-api-server.onrender.com"; 
const LOCAL_API_URL = "http://localhost:5000";
const API_BASE_URL = window.location.hostname === "localhost" ? LOCAL_API_URL : RENDER_API_URL;


// --- 1. Navbar Component (লগইন/লগআউট বাটন যোগ করা হয়েছে) ---
const Navbar = () => {
    // Auth0 হুক ব্যবহার করে অবস্থা ও ফাংশন অ্যাক্সেস
    const { isAuthenticated, logout, loginWithRedirect } = useAuth0();

    // কাস্টম লগইন বাটন: যদি Auth0 দিয়ে লগইন না করা থাকে, তাহলে লগইন রিডাইরেক্ট করবে
    const AuthButton = () => {
        if (isAuthenticated) {
            return (
                <button 
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-150"
                >
                    Logout
                </button>
            );
        }
        return (
            <button 
                onClick={() => loginWithRedirect()} // Auth0 Login Page এ রিডাইরেক্ট করবে
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150"
            >
                Login
            </button>
        );
    };

    return (
        <div className="bg-blue-600 p-4 text-white shadow-lg">
            <div className="flex justify-between items-center container mx-auto">
                <h1 className="text-xl font-bold">OnyxDrift Social App</h1>
                <AuthButton /> {/* Auth0 বাটন */}
            </div>
        </div>
    );
};


// --- 2. ProtectedRoute Component (Auth0-এর ফাংশন ব্যবহার) ---
// withAuthenticationRequired হল Auth0-এর আদর্শ ProtectedRoute
const ProtectedRoute = ({ component }) => {
    // Auth0 এর withAuthenticationRequired ব্যবহার করে কম্পোনেন্টকে সুরক্ষিত করা
    return withAuthenticationRequired(component, {
        // যদি লগইন না করা থাকে, তাহলে /login রুটে না পাঠিয়ে Auth0 Universal Login এ রিডাইরেক্ট করবে
        onRedirecting: () => <div className="text-center mt-20">Loading...</div>,
    });
};

// --- আপডেটেড Home Component (Feed) ---
// এটি আপনার সুরক্ষিত /feed রুটে ব্যবহার হবে
const Home = () => {
    // Auth0 হুক যা টোকেন পাওয়ার জন্য অপরিহার্য
    const { getAccessTokenSilently } = useAuth0(); 
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ডেটা আনার ফাংশন, যা টোকেন ব্যবহার করে
    const fetchProtectedPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Auth0 থেকে অ্যাক্সেস টোকেন সংগ্রহ করুন (নীরবে)
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    // এটি নিশ্চিত করে যে টোকেনটি আপনার API-এর জন্য উপযুক্ত
                    audience: 'https://onyx-drift-api.com', 
                },
            });

            // 2. সুরক্ষিত ব্যাকএন্ড API-এ কল করুন
            // এখানে নিশ্চিত করুন যে রুটটি /posts, /api/posts নয়
            const apiUrl = `${API_BASE_URL}/posts`; 
            
            const response = await fetch(apiUrl, {
                headers: {
                    // টোকেনটি Authorization Header-এ যুক্ত করা হয়েছে
                    Authorization: `Bearer ${accessToken}`, 
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // যদি ব্যাকএন্ড টোকেন প্রত্যাখ্যান করে (401), এই এররটি ক্যাচ হবে
                throw new Error('API Token Verification Failed or Network Error');
            }

            const data = await response.json();
            setPosts(data.data); // আপনার ব্যাকএন্ডের প্রতিক্রিয়া কাঠামো অনুযায়ী 
            
        } catch (err) {
            console.error("Error accessing protected API:", err);
            setError(err.message);
            // ⭐ যদি আপনার পুরোনো 'Login failed. Check server connection.' মেসেজটি 
            // এই এরর হ্যান্ডেলারে থাকে, তবে এটি এখানেই ট্রিগার হচ্ছে।
            
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently]); // ডিপেন্ডেন্সিগুলি যোগ করা হয়েছে

    // কম্পোনেন্ট মাউন্ট হওয়ার সময় ডেটা আনুন
    React.useEffect(() => {
        fetchProtectedPosts();
    }, [fetchProtectedPosts]);

    if (loading) return <div className="text-center mt-20">Loading Feed...</div>;
    if (error) return <div className="text-red-600 text-center mt-20">Error loading data: {error}</div>;


    return (
        <div className="text-center mt-8 font-semibold text-gray-800">
            <h1 className="text-3xl">Welcome Home (Feed)</h1>
            <h2 className="text-xl mt-4 text-green-700">Protected Data Loaded Successfully!</h2>
            <p className="mt-2 text-gray-500">Total Posts: {posts.length}</p>
            {/* এখানে পোস্টগুলি রেন্ডার করুন */}
        </div>
    );
};
const Profile = () => {
    const { user } = useAuth0();
    return (
        <div className="text-center mt-8">
            <h2 className="text-2xl font-medium">User Profile</h2>
            <p className="text-gray-600 mt-2">Displaying profile for User: **{user?.name}**</p>
        </div>
    );
};
const Pages = ({ name }) => (<h2 className="text-2xl text-center mt-8 font-medium">{name} Page Content</h2>);

// --- 3. Login/Registration Component (বাদ দেওয়া হবে) ---
// যেহেতু আমরা Auth0 Universal Login ব্যবহার করছি, এই ফাইলগুলির প্রয়োজন নেই।
// ব্যবহারকারীকে লগইন করার জন্য Navbar-এর বাটন যথেষ্ট।
// একটি Landing Page তৈরি করা যেতে পারে।
const LandingPage = () => (
    <div className="text-center mt-20">
        <h1 className="text-4xl font-bold text-gray-800">OnyxDrift Social App</h1>
        <p className="text-lg text-gray-600 mt-4">Please use the **Login** button above to authenticate.</p>
    </div>
);


// --- 4. Main App Component ---
function AppContent() {
    return (
        <Router>
            <Navbar />
            <div className="container mx-auto p-4">
                <Routes>
                    {/* Public Routes - Landing Page */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Protected Routes (withAuthenticationRequired ব্যবহার) */}
                    {/* withAuthenticationRequired একটি কম্পোনেন্ট প্রত্যাশা করে, তাই element-এর মধ্যে component={Home} ব্যবহার করা হয়েছে */}
                    <Route path="/feed" element={<ProtectedRoute component={Home} />} />
                    <Route path="/friends" element={<ProtectedRoute component={Pages} name="Friends" />} />
                    <Route path="/groups" element={<ProtectedRoute component={Pages} name="Groups" />} />
                    <Route path="/events" element={<ProtectedRoute component={Pages} name="Events" />} />
                    <Route path="/marketplace" element={<ProtectedRoute component={Pages} name="Marketplace" />} />
                    <Route path="/chat" element={<ProtectedRoute component={Chat} />} />
                    <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
                    
                    {/* কাস্টম /login এবং /register রুটগুলির আর প্রয়োজন নেই */}
                    <Route path="/login" element={<Navigate to="/" replace />} /> 
                    <Route path="/register" element={<Navigate to="/" replace />} /> 
                    
                </Routes>
            </div>
        </Router>
    );
}


// --- 5. Root Component (Auth0Provider Wrap) ---
// এটি আপনার main.jsx ফাইলে যাবে
function Root() {
    // === Auth0 কনফিগারেশন ভ্যালুগুলি ===
    const AUTH0_DOMAIN = 'dev-6d0nxccsaycctfl1.us.auth0.com'; // আপনার দেওয়া বেস ডোমেইন
    const AUTH0_CLIENT_ID = 'আপনার-Auth0-ক্লায়েন্ট-আইডি'; // <--- এখানে আপনার Client ID দিন
    const API_AUDIENCE = 'https://onyx-drift-api.com'; // আপনার দেওয়া API Audience

    // যদি Auth0Provider লোড হতে দেরি করে
    const { isLoading, error } = useAuth0();

    if (error) {
        return <div className="text-red-600 text-center mt-20">Auth0 Error: {error.message}</div>;
    }

    if (isLoading) {
        return <div className="text-center mt-20">Loading authentication data...</div>;
    }


    return (
        // এখানে Auth0Provider যোগ করা হয়েছে
        <Auth0Provider
            domain={AUTH0_DOMAIN}
            clientId={AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin, 
                audience: API_AUDIENCE, // API Access Token অনুরোধ
            }}
        >
            <AppContent />
        </Auth0Provider>
    );
}

export default Root;