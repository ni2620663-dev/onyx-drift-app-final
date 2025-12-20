import React, { useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth0, withAuthenticationRequired, Auth0Provider } from "@auth0/auth0-react"; 

// --- API Configuration ---
const RENDER_API_URL = "https://onyx-drift-api-server.onrender.com"; 
const LOCAL_API_URL = "http://localhost:5000";
const API_BASE_URL = window.location.hostname === "localhost" ? LOCAL_API_URL : RENDER_API_URL;
const API_AUDIENCE = 'https://onyx-drift-api.com'; 

// --- Navbar Component ---
const Navbar = () => {
    const { isAuthenticated, logout, loginWithRedirect } = useAuth0();

    return (
        <div className="bg-blue-600 p-4 text-white shadow-lg">
            <div className="flex justify-between items-center container mx-auto">
                <h1 className="text-xl font-bold">OnyxDrift</h1>
                <nav className="flex space-x-4 ml-auto mr-4">
                    <NavLink to="/" className={({ isActive }) => `hover:text-gray-200 ${isActive ? 'font-bold underline' : ''}`}>Home</NavLink>
                    {isAuthenticated && (
                        <>
                            <NavLink to="/feed" className={({ isActive }) => `hover:text-gray-200 ${isActive ? 'font-bold underline' : ''}`}>Feed</NavLink>
                            <NavLink to="/profile" className={({ isActive }) => `hover:text-gray-200 ${isActive ? 'font-bold underline' : ''}`}>Profile</NavLink>
                            <NavLink to="/chat" className={({ isActive }) => `hover:text-gray-200 ${isActive ? 'font-bold underline' : ''}`}>Chat</NavLink>
                        </<>
                    )}
                </nav>
                {isAuthenticated ? (
                    <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className="bg-red-500 py-2 px-4 rounded">Logout</button>
                ) : (
                    <button onClick={() => loginWithRedirect()} className="bg-green-500 py-2 px-4 rounded">Login</button>
                )}
            </div>
        </div>
    );
};

// --- ProtectedRoute ---
const ProtectedRoute = ({ component: Component }) => {
    const WrappedComponent = withAuthenticationRequired(Component, {
        onRedirecting: () => <div className="text-center mt-20">Loading Authentication...</div>,
    });
    return <WrappedComponent />;
};

// --- Home (Feed) Component ---
const Home = () => {
    const { getAccessTokenSilently } = useAuth0(); 
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProtectedPosts = useCallback(async () => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: { audience: API_AUDIENCE },
            });

            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) throw new Error("API call failed");
            const data = await response.json();
            setPosts(data.data || []); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently]);

    React.useEffect(() => { fetchProtectedPosts(); }, [fetchProtectedPosts]);

    if (loading) return <div className="text-center mt-20">Loading Feed...</div>;
    return (
        <div className="text-center mt-8">
            <h1 className="text-3xl font-bold">Feed</h1>
            <p className="mt-4">Total Posts: {posts.length}</p>
        </div>
    );
};

// --- Other Components ---
const Profile = () => {
    const { user } = useAuth0();
    return <div className="text-center mt-8"><h2>Profile: {user?.name}</h2><p>{user?.email}</p></div>;
};

const LandingPage = () => <div className="text-center mt-20"><h1 className="text-4xl font-bold">Welcome to OnyxDrift</h1><p className="mt-4">Please login to start.</p></div>;

// --- Main App Logic ---
function AppContent() {
    return (
        <Router>
            <Navbar />
            <div className="container mx-auto p-4">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/feed" element={<ProtectedRoute component={Home} />} />
                    <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
                    <Route path="/chat" element={<ProtectedRoute component={() => <div className="text-center mt-8">Chat Content</div>} />} />
                    <Route path="*" element={<h2 className="text-center mt-20">404 - Not Found</h2>} />
                </Routes>
            </div>
        </Router>
    );
}

const AuthWrapper = ({ children }) => {
    const { isLoading, error } = useAuth0();
    if (error) return <div className="text-center mt-20">Auth0 Error: {error.message}</div>;
    if (isLoading) return <div className="text-center mt-20">Loading...</div>;
    return children;
}

export default function App() {
    return (
        <Auth0Provider
            domain="dev-6d0nxccsaycctfl1.us.auth0.com"
            clientId="tcfTAHv3K8KC1VwtZQrqIbqsZRN2PJFr"
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: API_AUDIENCE,
            }}
            useRefreshTokens={true}
            cacheLocation="localstorage"
        >
            <AuthWrapper><AppContent /></AuthWrapper>
        </Auth0Provider>
    );
}