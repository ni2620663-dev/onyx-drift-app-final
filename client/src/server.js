// আপনার সার্ভার ফাইল (সম্ভবত src/server.js বা client/src/server.js)

// CommonJS 'require' এর পরিবর্তে ES Module 'import' ব্যবহার করুন
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; 
import { fileURLToPath } from 'url'; // Path ঠিক করার জন্য আমদানি করা হলো

// Auth0 JWT Bearer মিডলওয়্যার আমদানি করুন
import { auth } from 'express-oauth2-jwt-bearer';

// .env ফাইল লোড করুন
dotenv.config();

const app = express();

// ⭐⭐ Node.js ES Modules এর জন্য __dirname এবং __filename তৈরি করা ⭐⭐
// Node.js এ __dirname তৈরি করা
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- পরিবেশ ভেরিয়েবল ---
const PORT = process.env.PORT || 10000; 

// --- CORS কনফিগারেশন ---
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', 
    'capacitor://localhost',
    'https://onyx-drift-app.pages.dev',
    'https://onyx-drift.com' // কাস্টম ডোমেইন যোগ করা হলো
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json()); 

// --- Auth0 JWT ভেরিফিকেশন মিডলওয়্যার ---
const AUTH0_AUDIENCE = 'https://onyx-drift-api.com'; 
const AUTH0_ISSUER_BASE_URL = 'https://dev-6d0nxccsaycctfl1.us.auth0.com/'; 

const jwtCheck = auth({
    audience: AUTH0_AUDIENCE,
    issuerBaseURL: AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
});

// --- API রুটস ---

// 1. পাবলিক রুট (আন-সুরক্ষিত)
app.get('/api', (req, res) => { 
    res.json({ message: 'Welcome to the OnyxDrift API Server. Status: Online' });
});


// 2. সুরক্ষিত রুট (Protected Route)
app.get('/api/posts', jwtCheck, (req, res) => { 
    console.log("Protected /api/posts route accessed successfully.");
    const userId = req.auth.payload.sub; 

    res.status(200).json({ 
        message: "Successfully retrieved protected posts data!", 
        user_id_from_token: userId,
        data: [
            { id: 1, title: "First Protected Post", author: "User " + userId.slice(-4) },
            { id: 2, title: "Second Protected Post", author: "Admin" }
        ] 
    });
});

// ⭐⭐⭐ স্ট্যাটিক ফাইল পরিবেশন এবং ফ্রন্টএন্ড রাউটিং ফলব্যাক ⭐⭐⭐

// path.join() ব্যবহার করে প্রজেক্ট রুটের সাপেক্ষে client/dist এর পাথ তৈরি করা
const buildPath = path.join(__dirname, '..', 'client', 'dist');


// 3. স্ট্যাটিক ফাইল পরিবেশন
app.use(express.static(buildPath));

// 4. ক্লায়েন্ট-সাইড রাউটিং-এর জন্য ক্যাচ-অল রুট (ফলব্যাক)
// এই রুটটি অবশ্যই সকল API রুটের পরে যুক্ত করতে হবে।
app.get('*', (req, res) => {
    // index.html ফাইলটি dist ফোল্ডারের মধ্যে থাকবে
    res.sendFile(path.join(buildPath, 'index.html'));
});

// --- সার্ভার চালু করুন ---
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});