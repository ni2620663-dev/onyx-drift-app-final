import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// নিশ্চিত করুন এই Audience এবং Issuer আপনার Auth0 ড্যাশবোর্ডের সাথে হুবহু মিলছে।
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', 
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', 
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
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Signal Blocked: CORS Security Policy'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};

app.use(cors(corsOptions));

// ৪. বডি পার্সার
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// ৫. Static Folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

/* ==========================================================
    🧠 NEURAL PULSE MIDDLEWARE (User Activity Sync)
========================================================== */
const updateNeuralPulse = async (req, res, next) => {
    try {
        const auth0Id = req.auth?.payload?.sub; 
        if (auth0Id) {
            await User.updateOne(
                { auth0Id: auth0Id },
                { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }
            );
        }
    } catch (err) {
        console.warn("Pulse bypass log (Non-critical):", err.message);
    }
    next();
};

/* ==========================================================
    📡 এপিআই রাউটস (Authentication applied to all)
========================================================== */

// পাবলিক রুট (Health Check)
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core is Online!"));

// প্রোটেক্টড রুটস
app.get("/api/posts/neural-feed", checkJwt, updateNeuralPulse, getNeuralFeed);

app.use("/api/user", checkJwt, updateNeuralPulse, userRoutes); 
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
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'], // WebSocket prioritized
    path: '/socket.io/'
});

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
}) : null;

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
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });
});

/* ==========================================================
    🛡️ GLOBAL ERROR HANDLER (401 Fix logic)
========================================================== */
app.use((err, req, res, next) => {
    // Auth0 বা JWT এরর হ্যান্ডলিং
    if (err.name === 'UnauthorizedError' || err.status === 401) {
        console.error("❌ Auth Error:", err.message);
        return res.status(401).json({ 
            error: 'Identity Verification Failed', 
            message: "Token is invalid, expired, or audience mismatch.",
            suggestion: "Check if AUTH_AUDIENCE in frontend matches audience in backend."
        });
    }

    console.error("🔥 Critical System Log:", err);
    res.status(err.status || 500).json({ 
        error: "Neural Grid Breakdown", 
        message: err.message || "Internal Server Error"
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
    📡 ENVIRONMENT: ${process.env.NODE_ENV || 'development'}
    🛡️ AUTH0 DOMAIN: dev-prxn6v2o08xp5loz.us.auth0.com
    =========================================
    `);
});