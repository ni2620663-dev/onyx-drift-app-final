import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Auth0 JWT Bearer মিডলওয়্যার
import { auth } from 'express-oauth2-jwt-bearer';

dotenv.config();

const app = express();

// --- Auth0 কনফিগারেশন ---
// Auth0 ড্যাশবোর্ড থেকে প্রাপ্ত ভ্যালু
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com'; 
const AUTH0_ISSUER_BASE_URL = process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-6d0nxccsaycctfl1.us.auth0.com/'; 

// টোকেন যাচাই করার মিডলওয়্যার তৈরি (jwtCheck)
const jwtCheck = auth({
    audience: AUTH0_AUDIENCE,
    issuerBaseURL: AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
});

// --- CORS কনফিগারেশন ফিক্স ---
// এখানে আপনার সমস্ত অনুমোদিত ফ্রন্টএন্ড URL যোগ করুন
const allowedOrigins = [
    // ✅ আপনার লাইভ Cloudflare ডোমেইন (এই ডোমেইনটি CORS ত্রুটি দূর করবে)
    'https://c32dbd3f.onyx-drift-app.pages.dev', 
    'http://localhost:5173', 
    'http://localhost:3000', 
];

const corsOptions = {
    origin: (origin, callback) => {
        // যদি origin অনুমোদিত তালিকায় থাকে অথবা যদি এটি একটি ব্রাউজার-বিহীন অনুরোধ হয়
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

// --- রুট রাউট (হেলথ চেক) ---
app.get('/', (req, res) => {
    res.status(200).send("OnyxDrift Backend Server is Live and Operational!");
});

// --- API রাউট ---

// 1. **আন-সুরক্ষিত রুট:** (যদি আপনার কোনো পাবলিক API দরকার হয়)
// app.get("/api/public", (req, res) => res.json({ message: "Public data" }));


// 2. **সুরক্ষিত রুট (Protected Route):**
// আপনার /api/login রুটটি সরিয়ে দেওয়া হয়েছে। এখন আপনার ফ্রন্টএন্ড /api/posts এ কল করবে।
app.get('/api/posts', jwtCheck, (req, res) => {
    // টোকেন বৈধ হলে তবেই এই কোড চলবে
    const userId = req.auth.payload.sub; // Auth0 ইউজার ID
    
    // ⭐ এখানে আপনার আসল ডাটাবেস লজিক যোগ করুন।
    res.status(200).json({ 
        message: "Successfully retrieved protected posts data!", 
        user_id_from_token: userId,
        data: [{ id: 1, title: "Protected Post" }] 
    });
});


// Render-এর পরিবেশ থেকে PORT ব্যবহার করুন
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// *** Note on Facebook Login / Creative Account: ***
// Auth0 নিজে থেকেই Creative Account/Sign Up ফ্লো হ্যান্ডেল করে। আপনি Auth0 Dashboard-এ গিয়ে 
// Social Connections (Facebook, Google, etc.) চালু করলে, Universal Login Page-এ সেই অপশনগুলি চলে আসবে।
// আপনার ব্যাকএন্ডে এই ফ্লো-এর জন্য কোনো পরিবর্তন দরকার নেই।