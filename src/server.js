// src/server.js

import 'dotenv/config'; 
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // CORS হ্যান্ডলিং এর জন্য
import mongoose from 'mongoose'; // MongoDB সংযোগের জন্য

// ESM (ECMAScript Module) এ __dirname সেটআপ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// .env ফাইল থেকে PORT এবং MONGO_URI লোড করা (Render-এ Environment Variables থেকে লোড হবে)
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI; 

// =======================================================
// 🌐 ডাটাবেস সংযোগ (Mongoose)
// =======================================================
if (!MONGO_URI) {
    console.error("🔴 Error: MONGO_URI is not defined in environment variables! App will run without DB access.");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log("✅ MongoDB connected successfully!");
        })
        .catch(err => {
            console.error("❌ MongoDB connection error:", err.message);
            // সংযোগ ব্যর্থ হলেও সার্ভার যেন চালু থাকে
        });
}

// =======================================================
// ⚙️ মিডলওয়্যার কনফিগারেশন
// =======================================================

// 💡 CORS Whitelisting: আপনার ফ্রন্টএন্ড ডোমেনকে বিশেষভাবে অনুমতি দেওয়া হচ্ছে
const allowedOrigins = [
    'https://onyx-drift.com', // 🚨 আপনার ফ্রন্টএন্ড ডোমেন
    'http://localhost:3000',  // লোকাল ডেভেলপমেন্টের জন্য
    'http://localhost:5173'   // Vite/React Dev Server এর জন্য
];

app.use(cors({
    origin: function (origin, callback) {
        // যদি অনুরোধটি অনুমোদিত অরিজিন থেকে আসে অথবা যদি অরিজিন না থাকে (যেমন Postman থেকে)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // যদি অন্য কোনো ডোমেন থেকে অ্যাক্সেস করার চেষ্টা করা হয়
            callback(new Error(`Not allowed by CORS for origin: ${origin}`)); 
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true // কুকি বা Auth হেডার পাঠানোর অনুমতি
}));

// ইনকামিং JSON ডেটা পার্স করার জন্য
app.use(express.json()); 
// ইনকামিং URL-encoded ডেটা (ফর্ম ডেটা) পার্স করার জন্য
app.use(express.urlencoded({ extended: true }));


// =======================================================
// 🔐 এপিআই রুটিং (API Routing)
// =======================================================

// লগইন রুট
app.post('/api/login', (req, res) => {
    const { email, password } = req.body; 

    console.log(`Login attempt from ${req.headers.origin}: ${email}`);

    // ডামি লগইন লজিক
    if (email === "test@example.com" && password === "123456") {
        return res.status(200).json({ 
            success: true, 
            message: "Login successful (Dummy Test)",
            token: "fake_jwt_token_for_shakib"
        });
    } else if (email && password) {
        // যদি ডাটাবেস চেক না থাকে, এটি ডামি ফেল রেসপন্স
         return res.status(401).json({ 
            success: false, 
            message: "Invalid credentials or User not found." 
        });
    } else {
         return res.status(400).json({ 
            success: false, 
            message: "Email and password are required." 
        });
    }
});


// পোস্ট রুট
app.get('/api/posts', (req, res) => {
    return res.status(200).json({ 
        posts: [
            { id: 1, user: 'shakib001', text: 'CORS Fixed! App is Live.' },
            { id: 2, user: 'test