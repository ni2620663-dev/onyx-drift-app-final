import React, { useState } from 'react';

// ⚠️ প্রক্সি সার্ভারের URL ব্যবহার করা হচ্ছে, যাতে ফ্রন্টএন্ড থেকে আসা অনুরোধ 
// প্রথমে প্রক্সি সার্ভারে যায় এবং সেখান থেকে আসল ব্যাকএন্ডে ফরোয়ার্ড হয়।
// আপনার প্রক্সি সার্ভিসের URL টি এখানে দিন:
const RENDER_PROXY_URL = "https://onyx-drift-api-server.onrender.com"; 

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false); // লগইন স্ট্যাটাস

    // 💡 মূল ফাংশন: ফর্ম সাবমিট হলে এই ফাংশনটি কল হবে
    const handleLogin = async (e) => {
        e.preventDefault(); 

        setError(''); // পূর্বের ত্রুটি মুছে ফেলুন

        if (!email || !password) {
            setError('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।');
            return;
        }

        try {
            // API কল: প্রক্সি সার্ভারের মাধ্যমে লগইন তথ্য পাঠানো
            const response = await fetch(`${RENDER_PROXY_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // "Invalid credentials or User not found." ত্রুটি এখান থেকে আসবে
                setError(errorData.message || 'লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড ভুল।'); 
                return;
            }

            // লগইন সফল হলে
            const data = await response.json();
            console.log("Login successful:", data);
            
            // 🚨 এখানে আপনার অ্যাপ্লিকেশনের পরবর্তী স্টেপ যোগ করুন (যেমন: টোকেন সেভ করা, ফিড পেজে রিডাইরেক্ট করা)
            setIsLoggedIn(true);
            // window.location.href = '/feed'; 

        } catch (err) {
            console.error("Network or server error:", err);
            setError('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
        }
    };

    if (isLoggedIn) {
        return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>লগইন সফল! 🎉</h2>;
    }

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>লগইন</h2>
            
            <form onSubmit={handleLogin}> 
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>ইমেইল</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="আপনার ইমেইল আইডি"
                        required
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>পাসওয়ার্ড</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="আপনার পাসওয়ার্ড"
                        required
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </div>
                
                {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

                <button 
                    type="submit" 
                    style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    লগইন করুন
                </button>
            </form>
            
            {/* 💡 নতুন রেজিস্ট্রেশন লিঙ্ক যোগ করা হয়েছে */}
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                অ্যাকাউন্ট নেই? {" "}
                <a 
                    href="/register" 
                    style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}
                >
                    একটি অ্যাকাউন্ট তৈরি করুন
                </a>
            </p>

        </div>
    );
}