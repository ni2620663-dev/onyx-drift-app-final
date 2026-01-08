import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig'; // আপনার কনফিগ ফাইল নিশ্চিত করুন

// ১. ইউআরএল কোটেশন ঠিক করা হয়েছে
const BACKEND_LOGIN_URL = 'https://onyx-drift-app-final.onrender.com/api/auth/firebase-login';

const GoogleLoginButton: React.FC = () => {
    
    // Google Sign-In প্রক্রিয়া শুরু
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // idToken তৈরি (এটিই আপনার ব্যাকএন্ডে ইউজার ভেরিফাই করার চাবি)
            const idToken = await user.getIdToken();
            console.log("Firebase ID Token generated.");

            // idToken-কে ব্যাকএন্ডে পাঠানো
            await sendTokenToBackend(idToken);
            
            alert('লগইন সফল এবং ডাটাবেসে সিঙ্ক করা হয়েছে!');
            
        } catch (error: any) {
            console.error("Login Error:", error.code, error.message);
            alert(`লগইন ব্যর্থ হয়েছে: ${error.message}`);
        }
    };

    // idToken-কে Express সার্ভারে পাঠানোর ফাংশন
    const sendTokenToBackend = async (token: string) => {
        try {
            const response = await fetch(BACKEND_LOGIN_URL, {
                method: 'POST',
                headers: {
                    // Authorization header-এ Bearer Scheme ব্যবহার করা সবচেয়ে নিরাপদ
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ব্যাকএন্ডে টোকেন যাচাইয়ে সমস্যা হয়েছে।');
            }

            const data = await response.json();
            console.log("Backend Response:", data);
            
            // এখানে আপনি টোকেন বা ইউজার ডাটা localStorage/Context এ সেভ করতে পারেন

        } catch (error) {
            console.error("Backend Error:", error);
            throw error; 
        }
    };

    return (
        <button 
            onClick={handleGoogleLogin} 
            className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all active:scale-95"
        >
            <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/041210_google_standard_color_64dp.png" 
                alt="Google" 
                className="w-5 h-5"
            />
            Login with Google
        </button>
    );
};

export default GoogleLoginButton;