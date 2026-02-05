// src/components/logout.tsx (উদাহরণ)

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LogoutButton: React.FC = () => {
    // useAuth0 হুক থেকে logout ফাংশনটি নিন
    const { logout } = useAuth0();

    const handleLogout = () => {
        // logout ফাংশনটি কল করুন, যা Auth0 সেশন শেষ করে দেয়
        logout({
            logoutParams: {
                returnTo: window.location.origin, // লগআউটের পর বেস URL এ ফেরত যান
            },
        });
    };

    return (
        <button
            onClick={handleLogout} // ⭐ onClick ইভেন্টে logout কল করা হলো
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-md"
        >
            Logout
        </button>
    );
};

export default LogoutButton;