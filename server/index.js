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

// ৩. CORS কনফিগারেশন
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

// ৪. বডি পার্সার
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

/* ==========================================================
    🧠 NEURAL PULSE & SYNC MIDDLEWARE
========================================================== */
const updateNeuralPulse = async (req, res, next) => {
    // Auth0 sub আইডি বের করার চেষ্টা
    const auth0Id = req.auth?.payload?.sub || req.user?.sub; 
    
    if (auth0Id) {
        // নন-ব্লকিং ব্যাকগ্রাউন্ড আপডেট
        User.updateOne(
            { auth0Id: auth0Id },
            { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }
        ).catch(err => console.log("Pulse bypass log:", err.message));
    }
    next();
};

// ৫. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
});

// ৬. Redis কানেকশন
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
}) : null;

if (redis) {
    redis.on("error", (err) => console.error("Redis Grid Error:", err));
    redis.on("connect", () => console.log("📡 Neural Cache Connected (Redis)"));
}

/* ==========================================================
    ⏰ CRON JOBS
========================================================== */
cron.schedule('0 0 * * *', async () => {
    console.log("Running Neural Pulse Audit...");
    // এখানে ডিজিটাল লিগ্যাসি লজিক রান হবে
});

/* ==========================================================
    📡 এপিআই রাউটস
========================================================== */

// পাবলিক রুট
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core is Online!"));

// 🛠️ Neural Feed - স্পেশাল প্রায়োরিটি রুট
app.get("/api/posts/neural-feed", checkJwt, updateNeuralPulse, getNeuralFeed);

// 🛠️ ফিচার রাউটস (সিরিয়াল অনুযায়ী)
app.use("/api/users", checkJwt, updateNeuralPulse, userRoutes);
app.use("/api/profile", checkJwt, updateNeuralPulse, profileRoutes);
app.use("/api/posts", checkJwt, updateNeuralPulse, postRoutes); 
app.use("/api/reels", checkJwt, updateNeuralPulse, reelRoutes); 
app.use("/api/stories", checkJwt, updateNeuralPulse, storyRoute);
app.use("/api/messages", checkJwt, updateNeuralPulse, messageRoutes); 
app.use("/api/groups", checkJwt, updateNeuralPulse, groupRoutes); 
app.use("/api/market", checkJwt, updateNeuralPulse, marketRoutes);
app.use("/api/admin", checkJwt, updateNeuralPulse, adminRoutes);

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */
io.on("connection", (socket) => {
    console.log("New Neural Connection:", socket.id);

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
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });
});

/* ==========================================================
    🛡️ GLOBAL ERROR HANDLER (Enhanced for debugging)
========================================================== */
app.use((err, req, res, next) => {
    // লগ ফাইলে পূর্ণ এরর প্রিন্ট হবে
    console.error("Critical System Log:", err);

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ 
            error: 'Identity Verification Failed', 
            message: "Authentication token is missing or invalid." 
        });
    }

    res.status(500).json({ 
        error: "Neural Grid Breakdown", 
        message: err.message || "An unexpected error occurred in the core."
    });
});

/* ==========================================================
    🚀 SERVER START
========================================================== */
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    🚀 ONYX CORE ACTIVE ON PORT: ${PORT}
    🧠 NEURAL SYNC: ENABLED
    📡 DATABASE: CONNECTED
    🛡️ SECURITY: JWT/CORS ACTIVE
    =========================================
    `);
});