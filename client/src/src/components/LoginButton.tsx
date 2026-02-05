// src/components/loginbatton.tsx

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react'; // 👈 অবশ্যই এটি আমদানি করুন

const LoginButton: React.FC = () => {
    // useAuth0 হুক থেকে loginWithRedirect ফাংশনটি নিন
    const { loginWithRedirect } = useAuth0();

    const handleLogin = () => {
        // loginWithRedirect ফাংশনটি কল করুন
        loginWithRedirect();
        
        // ঐচ্ছিকভাবে, আপনি যদি চান লগইনের পর অন্য কোনো নির্দিষ্ট রুটে যাক:
        /*
        loginWithRedirect({
            authorizationParams: {
                redirect_uri: window.location.origin + '/feed',
            },
        });
        */
    };

    return (
        <button
            onClick={handleLogin} // ⭐ onClick ইভেন্টে loginWithRedirect কল করা হলো
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-md"
        >
            Login / Sign Up
        </button>
    );
};

export default LoginButton;