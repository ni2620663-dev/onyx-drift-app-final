import express from "express";
import cors from "cors";

const app = express();

// 1. CORS Configuration:
// ডেভেলপমেন্ট এবং প্রোডাকশন পরিবেশের জন্য ক্রস-অরিজিন রিকোয়েস্ট অনুমোদনের জন্য।
// যদি আপনি Render/Netlify-এ ডিপ্লয় করেন, তাহলে `origin: true` (সব অরিজিন) অথবা
// `origin: "https://onyx-drift-app-final.netlify.app"` (নির্দিষ্ট ফ্রন্টএন্ড) ব্যবহার করতে পারেন।
app.use(cors({
    origin: true, // সব অরিজিন থেকে রিকোয়েস্ট গ্রহণ করবে
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true, // কুকিজ, অথরাইজেশন হেডার পাস করার অনুমতি দেয়
}));

// 2. JSON middleware: Incoming request body পার্স করার জন্য।
app.use(express.json());

// --- রুট রাউট (সার্ভার হেলথ চেক) ---
app.get('/', (req, res) => {
    res.status(200).send("OnyxDrift Backend Server is Live and Operational!");
});

// --- API রাউট ---

// Example login route
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // ⚠️ গুরুত্বপূর্ণ: এই লজিকটি একটি ডামি।
    if (email === "test@example.com" && password === "123456") {
        const dummyUser = { 
            id: 'u123',
            name: 'Test User',
            email: email,
            avatar: 'https://placehold.co/40x40/007bff/ffffff?text=TU',
            token: 'dummy-jwt-token'
        };
        // সফল লগইন হলে ইউজার ডেটা সহ 200 OK পাঠানো হয়েছে
        res.json({ success: true, message: "Login successful", user: dummyUser });
    } else {
        // লগইন ব্যর্থ হলে 401 Unauthorised স্ট্যাটাস পাঠানো হয়েছে
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});


// Render-এর পরিবেশ থেকে PORT ব্যবহার করুন, না পেলে 5000 ব্যবহার করুন।
const PORT = process.env.PORT || 5000; 

// Server listen
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));