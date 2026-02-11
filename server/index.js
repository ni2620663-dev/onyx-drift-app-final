import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer';
import cron from 'node-cron';

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
connectDB();

// ২. রাউট ইম্পোর্ট
import userRoutes from './routes/user.js'; 
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import storyRoute from "./routes/stories.js";
import reelRoutes from "./routes/reels.js"; 
import profileRoutes from "./routes/profile.js"; 
import groupRoutes from "./routes/group.js"; 
import marketRoutes from "./routes/market.js"; 
import adminRoutes from "./routes/admin.js";      
import { getNeuralFeed } from "./controllers/feedController.js";

// 🛡️ Auth0 JWT ভেরিফিকেশন মিডলওয়্যার
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com', 
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`, 
  tokenSigningAlg: 'RS256'
});

// Cloudinary Config
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const app = express();
const server = http.createServer(app);

// ৩. CORS কনফিগারেশন (উন্নত করা হয়েছে)
const allowedOrigins = [
    "http://localhost:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://onyx-drift-app-final-u29m.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Signal Blocked: CORS Security Policy'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

// ৪. বডি পার্সার লিমিট
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

/* ==========================================================
    🧠 NEURAL PULSE UPDATE MIDDLEWARE (Fixed & Safer)
========================================================== */
const updateNeuralPulse = async (req, res, next) => {
    // Auth0 payload sub check
    const auth0Id = req.auth?.payload?.sub; 
    if (auth0Id) {
        try {
            // ✅ updateOne ব্যবহার করা হয়েছে যাতে ডুপ্লিকেট কি এরর এ প্রোসেস না থামে
            await User.updateOne(
                { auth0Id: auth0Id },
                { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }
            ).catch(e => console.log("Pulse background update bypassed."));
        } catch (err) {
            // লগকে ক্লিন রাখতে এরর সাইলেন্ট রাখা হয়েছে
        }
    }
    next();
};

// ৫. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
});

// ৬. Redis Setup
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
}) : null;

/* ==========================================================
    📡 এপিআই রাউটস
========================================================== */

// পাবলিক রাউট
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core is Online!"));

// 🛠️ Neural Feed (Priority)
// ✅ এরর হ্যান্ডলিং যোগ করা হয়েছে যাতে টোকেন না থাকলেও ক্রাশ না করে
app.get("/api/posts/neural-feed", (req, res, next) => {
    checkJwt(req, res, (err) => {
        if (err) return next(); // টোকেন এরর হলে গেস্ট হিসেবে হ্যান্ডেল করবে
        updateNeuralPulse(req, res, next);
    });
}, getNeuralFeed);

// প্রোফাইল ও ইউজার রাউটস
app.use("/api/profile", checkJwt, updateNeuralPulse, profileRoutes); 
app.use("/api/posts", checkJwt, updateNeuralPulse, postRoutes); 
app.use("/api/reels", checkJwt, updateNeuralPulse, reelRoutes); 
app.use("/api/users", checkJwt, updateNeuralPulse, userRoutes);
app.use("/api/stories", checkJwt, updateNeuralPulse, storyRoute);
app.use("/api/messages", checkJwt, updateNeuralPulse, messageRoutes); 
app.use("/api/groups", checkJwt, updateNeuralPulse, groupRoutes); 

/* ==========================================================
    📡 REAL-TIME ENGINE
========================================================== */
io.on("connection", (socket) => {
    socket.on("addNewUser", async (auth0Id) => { 
        if (!auth0Id) return;
        socket.userId = auth0Id; 
        socket.join(auth0Id); 
        
        if (redis) {
            await redis.hset("online_users", auth0Id, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });

    socket.on("disconnect", async () => {
        if (redis && socket.userId) {
            await redis.hdel("online_users", socket.userId);
        }
    });
});

// ৮. গ্লোবাল এরর হ্যান্ডলার (FIXED)
app.use((err, req, res, next) => {
    console.error("Critical Error:", err.stack);
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Invalid Token' });
    }
    res.status(500).json({ 
        error: "Neural Grid Breakdown", 
        message: err.message 
    });
});

// ৯. সার্ভার লিসেনিং
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ONYX CORE ACTIVE ON PORT: ${PORT}`);
});