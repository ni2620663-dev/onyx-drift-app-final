// src/components/LoginComponent.jsx (নতুন Auth0 ভার্সন)
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginComponent = () => {
    const { loginWithRedirect } = useAuth0();

    const handleLogin = () => {
        // এই ফাংশনটি আপনাকে Auth0 Universal Login Page এ নিয়ে যাবে
        loginWithRedirect();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
                <h1 className="text-3xl font-extrabold text-blue-600 mb-6 text-center">
                    Login to OnyxDrift
                </h1>
                
                <button
                    onClick={handleLogin}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md hover:shadow-lg w-full"
                >
                    <i className="fab fa-facebook-f mr-2"></i> {/* ফেসবুক স্টাইল আইকন (ঐচ্ছিক) */}
                    Login / Create Account
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Uses Auth0 for Secure Authentication
                </p>
                
            </div>
        </div>
    );
};

export default LoginComponent;